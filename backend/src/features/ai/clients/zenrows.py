
from src.features.ai.utils.langgraph_utils import clean_markdown
from zenrows import ZenRowsClient
from src.features.ai.models.models import ScrapedWebsite
import logging
from src.settings import settings
logger = logging.getLogger(__name__)


class ZenRowsConfig:
    def __init__(self):
        self.api_key = settings.ZENROWS_API_KEY
        if not self.api_key:
            raise ValueError("ZENROWS_API_KEY is not set")
        self.client = ZenRowsClient(self.api_key)

    
    def scrape_website(self, url: str):
        """Scrape a website and return the content."""
        try:
            params = {"response_type": "markdown", "js_render":"true"}
            response = self.client.get(url, params=params)
            if response.status_code != 200:
                logger.error(f"Failed to scrape {url}, status code: {response.status_code}")
                return None

            content = clean_markdown(response.text)
         
            return ScrapedWebsite(content=content, url=url)
            
        except Exception as e:
            logger.error(f"Unexpected error in scrape_website for {url}: {e}", exc_info=True)
            return None

