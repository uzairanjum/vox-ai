"""
Utility functions for working with LangGraph.
"""
import logging
from typing import Dict, Any, Optional
import re

logger = logging.getLogger(__name__)

async def invoke_graph_safely(graph: Any, state: Dict[str, Any], **kwargs) -> Dict[str, Any]:
    """
    Safely invoke a LangGraph workflow, handling all possible errors.
    
    Args:
        graph: The LangGraph compiled graph
        state: The state dictionary to pass to the graph
        **kwargs: Additional arguments (ignored for compatibility)
        
    Returns:
        Dict containing the response and other state fields
    """
    try:
        # Direct invocation with no extra parameters for maximum compatibility
        return await graph.ainvoke(state)
    except AttributeError as e:
        logger.warning(f"Async invoke not available: {e}")
        try:
            # Try synchronous invoke as fallback
            return graph.invoke(state)
        except Exception as e2:
            logger.error(f"All graph invocation methods failed: {e} / {e2}")
            return {
                "response": "I encountered a technical issue and couldn't process your request.",
                "suggestions": [],
                "summary": "Technical error occurred."
            }
    except Exception as e:
        logger.error(f"Error invoking graph: {e}")
        return {
            "response": "I encountered a technical issue and couldn't process your request.",
            "suggestions": [],
            "summary": "Technical error occurred."
        }


def clean_markdown(text: str) -> str:
        """
        Clean markdown content by removing problematic links and images while preserving markdown structure.
        Keeps headings, bold, italic, lists, etc.
        
        Args:
            text: Raw markdown text
            
        Returns:
            Cleaned markdown with structure preserved (returns empty string on error)
        """
        try:
            # Handle empty string
            if not text or not text.strip():
                return ""
            
            # Store original for fallback
            original_text = text
            
            # Remove image markdown ![alt](url) - keep alt text if meaningful
            try:
                text = re.sub(r'!\[([^\]]+)\]\([^\)]+\)', r'\1', text)
                text = re.sub(r'!\[\]\([^\)]+\)', '', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error removing image markdown: {e}")
                text = original_text
            
            # Remove markdown links [text](url) and keep only the text
            try:
                text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error removing markdown links: {e}")
            
            # Remove reference-style links [text][ref]
            try:
                text = re.sub(r'\[([^\]]+)\]\[[^\]]*\]', r'\1', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error removing reference-style links: {e}")
            
            # Remove standalone link references like [1]: url
            try:
                text = re.sub(r'\[[0-9]+\]:\s*http[^\s]+', '', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error removing link references: {e}")
            
            # Remove HTML comments
            try:
                text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
            except (re.error, TypeError) as e:
                logger.warning(f"Error removing HTML comments: {e}")
            
            # Remove any remaining HTML tags
            try:
                text = re.sub(r'<[^>]+>', '', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error removing HTML tags: {e}")
            
            # Remove empty brackets and braces
            try:
                text = re.sub(r'\[\s*\]', '', text)
                text = re.sub(r'\{\s*\}', '', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error removing empty brackets: {e}")
            
            # Remove standalone URLs
            try:
                text = re.sub(r'https?://[^\s]+', '', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error removing URLs: {e}")
            
            # Clean up multiple consecutive blank lines
            try:
                text = re.sub(r'\n{3,}', '\n\n', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error cleaning blank lines: {e}")
            
            # Clean up multiple spaces
            try:
                text = re.sub(r' {2,}', ' ', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error cleaning spaces: {e}")
            
            # Remove leading/trailing whitespace from each line while preserving structure
            try:
                lines = [line.rstrip() for line in text.split('\n')]
                text = '\n'.join(lines)
            except (AttributeError, TypeError) as e:
                logger.warning(f"Error processing lines: {e}")
            
            # Final cleanup of excessive blank lines
            try:
                text = re.sub(r'\n{3,}', '\n\n', text)
            except (re.error, TypeError) as e:
                logger.warning(f"Error in final cleanup: {e}")
            
            # Final safety check
            result = text.strip() if text else ""
            
            # Validate result is not empty (if original had content)
            if original_text.strip() and not result:
                logger.warning("Cleaning resulted in empty text, returning original")
                return original_text.strip()
            
            return result
            
        except Exception as e:
            logger.error(f"Unexpected error in clean_markdown: {e}", exc_info=True)
            # Return original text if available, otherwise empty string
            try:
                return text.strip() if text else ""
            except:
                return ""
