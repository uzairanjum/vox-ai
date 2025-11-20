import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv
import os
import sys
import signal
from typing import Dict, Any, Optional
from src.features.server.sockets.sockets import sio_app
from src.settings import settings

# Set protobuf environment variable early before any imports
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

# Enable UTF-8 console output on Windows
if os.name == "nt":
    try:
        # Try to set console to UTF-8 mode
        import ctypes

        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleOutputCP(65001)  # UTF-8
        os.environ["PYTHONIOENCODING"] = "utf-8"
    except:
        # If that fails, we'll fall back to ASCII-safe logging
        pass

# Import enhanced logging configuration
try:
    from src.features.server.config import setup_enhanced_logging

    setup_enhanced_logging()
    logger = logging.getLogger(__name__)
    logger.info("Enhanced debug logging system initialized")
except ImportError:
    # Fallback to basic logging if enhanced logging fails
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    logger = logging.getLogger(__name__)
    logger.warning("Using basic logging - enhanced debug features not available")

#
# Initialize FastAPI app
app = FastAPI(
    title="VOX Backend API",
    description="Secure conversation management API with AI agents",
    version="1.0.0",
)


# Import and setup security
try:
    # Try absolute import first (when running from src directory)
    try:
        from src.features.server.security import (
            create_cors_config,
            authenticate,
            check_rate_limit,
        )
    except ModuleNotFoundError:
        # Try relative import (when running from project root via main.py)
        from src.features.server.security import (
            create_cors_config,
            authenticate,
            check_rate_limit,
        )

    security_loaded = True
    logger.info("Security module loaded successfully")

    # Configure CORS
    cors_config = create_cors_config()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_config["allow_origins"],
        allow_credentials=cors_config["allow_credentials"],
        allow_methods=cors_config["allow_methods"],
        allow_headers=cors_config["allow_headers"],
        expose_headers=cors_config["expose_headers"],
    )
    logger.info("CORS middleware configured")
except Exception as e:
    logger.error(f"Error loading security module: {str(e)}")
    security_loaded = False
    logger.warning("Security module not loaded. API will run without authentication.")

    # Basic CORS setup if security module fails
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Not secure - for development only
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Safe logging utility for Unicode characters
def safe_log_text(text: str, max_length: int = 500) -> str:
    """Make text safe for logging by removing/replacing problematic Unicode characters."""
    if not text:
        return text

    try:
        # Truncate first
        if len(text) > max_length:
            text = text[:max_length] + "..."

        # Remove or replace problematic Unicode characters
        safe_text = ""
        for char in text:
            # Skip emojis and other problematic Unicode characters
            if ord(char) > 127:
                # Replace with safe equivalent or skip
                if ord(char) >= 0x1F600 and ord(char) <= 0x1F64F:  # Emoticons
                    safe_text += "[emoji]"
                elif ord(char) >= 0x1F300 and ord(char) <= 0x1F5FF:  # Misc symbols
                    safe_text += "[symbol]"
                elif ord(char) >= 0x1F680 and ord(char) <= 0x1F6FF:  # Transport symbols
                    safe_text += "[symbol]"
                elif ord(char) >= 0x2600 and ord(char) <= 0x26FF:  # Misc symbols
                    safe_text += "[symbol]"
                elif char in '""' "":  # Smart quotes
                    safe_text += '"'
                elif char == "—":  # Em dash
                    safe_text += "--"
                elif char == "…":  # Ellipsis
                    safe_text += "..."
                else:
                    safe_text += char  # Keep other Unicode chars like accented letters
            else:
                safe_text += char

        return safe_text
    except Exception:
        # Fallback: encode to ASCII and ignore errors
        return text.encode("ascii", "ignore").decode("ascii")


# Simple HTTP request logging (only if debug logging is enabled)
if os.environ.get("DEBUG_LOGS", "").lower() == "true":

    @app.middleware("http")
    async def log_requests(request, call_next):
        import time
        import json

        start_time = time.time()

        # Log HTTP request with clear formatting
        logger.info("=" * 60)
        logger.info(f"HTTP REQUEST: {request.method} {request.url.path}")

        # Show request body for POST/PUT (keep it simple)
        if (
            request.method in ["POST", "PUT", "PATCH"]
            and os.environ.get("LOG_REQUEST_BODY", "true").lower() == "true"
        ):
            try:
                body = await request.body()
                if body:
                    body_str = body.decode()
                    safe_body = safe_log_text(
                        body_str, 500
                    )  # First 500 chars only, Unicode-safe
                    logger.debug(f"  REQUEST BODY: {safe_body}")
            except Exception as e:
                logger.debug(f"  REQUEST BODY: [Could not decode body: {str(e)}]")

        # Process request
        response = await call_next(request)

        # Log response with timing
        process_time = time.time() - start_time
        logger.info(f"HTTP RESPONSE: {response.status_code} | {process_time:.2f}s")
        logger.info("=" * 60)

        return response


try:
    # Try absolute import first (when running from src directory)
    try:
        from src.features.server.api import router
    except ModuleNotFoundError:
        # Try relative import (when running from project root via main.py)
        from src.features.server.api import router

    api_loaded = True
    # Include API routes
    app.include_router(router, prefix="/ai/conversation")
    app.mount("/", sio_app)

    logger.info("API router loaded successfully")
except Exception as e:
    logger.error(f"Error loading API router: {str(e)}")
    import traceback

    logger.error(f"Full traceback: {traceback.format_exc()}")
    api_loaded = False
    logger.warning("API router not loaded. Only health endpoint will be available.")


def check_db_connection() -> bool:
    """Check if ChromaDB is accessible"""
    try:
        # Try absolute import first (when running from src directory)
        try:
            from src.features.ai.vector.vector_store import VectorStoreService
        except ModuleNotFoundError:
            # Try relative import (when running from project root via main.py)
            from src.features.ai.vector.vector_store import VectorStoreService

        vector_service = VectorStoreService()
        return vector_service.client is not None
    except Exception:
        return False


def signal_handler(signum: int, frame: Optional[Any]) -> None:
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}")
    logger.info("Shutting down server...")
    sys.exit(0)



def run_server() -> None:
    """Run the FastAPI server with proper configuration and signal handling"""
    try:
        # Register signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        logger.info("Starting FastAPI server")

        # Ensure persist directory exists
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        logger.info(f"CHROMA_PERSIST_DIR is sext to: {settings.CHROMA_PERSIST_DIR}")

        # Check for potential protobuf issues
        if not settings.PROTOBUF_FIXED:
            logger.warning("If you encounter protobuf errors, try one of these solutions:")
            logger.warning("1. Set PROTOBUF_FIXED=true in your environment")

        # Configure uvicorn with performance optimizations
        config = uvicorn.Config(
            app=app,
            host=settings.HOST,
            port=settings.PORT,
            log_level=settings.LOG_LEVEL.lower(),
            reload=settings.DEBUG,
            access_log=True,
            timeout_keep_alive=settings.KEEP_ALIVE,
            workers=settings.WORKERS, 
            limit_concurrency=settings.LIMIT_CONCURRENCY,
            limit_max_requests=settings.LIMIT_MAX_REQUESTS,
            timeout_graceful_shutdown=settings.GRACEFUL_SHUTDOWN,
            backlog=2048,  
            loop="asyncio", 
        )

        server = uvicorn.Server(config)
        server.run()

    except Exception as e:
        logger.error(f"Error starting the server: {str(e)}", exc_info=True)
        sys.exit(1)


# Import and include webhook routes
try:
    from src.features.server.sockets.sockets import router

    app.include_router(router)
except Exception as e:
    logger.error(f"Failed to mount webhook router: {e}")


@app.get("/ping")
async def ping():
    """Simple health check endpoint"""
    return {"status": "ok", "message": "pong"}


@app.get("/health")
def health_check() -> Dict[str, Any]:
    """Comprehensive health check of the service"""
    db_connected = check_db_connection()

    status = "healthy" if api_loaded and db_connected else "degraded"
    if not os.environ.get("OPENAI_API_KEY") or not os.environ.get("VOYAGE_API_KEY"):
        status = "degraded"

    return {
        "status": status,
        "components": {
            "api": {
                "status": "up" if api_loaded else "down",
                "details": (
                    "API router loaded successfully"
                    if api_loaded
                    else "API router failed to load"
                ),
            },
            "database": {
                "status": "up" if db_connected else "down",
                "type": "ChromaDB",
                "persist_dir": os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db"),
            },
            "services": {
                "voyage": {
                    "status": (
                        "configured"
                        if os.environ.get("VOYAGE_API_KEY")
                        else "not configured"
                    )
                },
                "openai": {
                    "status": (
                        "configured"
                        if os.environ.get("OPENAI_API_KEY")
                        else "not configured"
                    )
                },
            },
        },
        "environment": {
            "python_version": sys.version.split()[0],
            "protobuf_implementation": os.environ.get(
                "PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION", "unknown"
            ),
        },
    }


# Add route logging for debugging
@app.on_event("startup")
async def startup_event():
    # Log all routes for debugging
    logger.info("=== Mounted Routes ===")
    for route in app.routes:
        if hasattr(route, "path"):
            methods = getattr(route, "methods", ["Unknown"])
            logger.info(f"{methods} {route.path}")
    logger.info("======================")


if __name__ == "__main__":
    run_server()
