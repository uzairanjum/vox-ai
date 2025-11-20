from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):



    # Server settings
    HOST: str = os.getenv('HOST', '0.0.0.0')
    PORT: int = os.getenv('PORT', 8000)
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'info')
    KEEP_ALIVE: int = os.getenv('KEEP_ALIVE', 30)
    WORKERS: int = os.getenv('WORKERS', 1)
    DEBUG: bool = os.getenv('DEBUG', True)
    LIMIT_CONCURRENCY: int = os.getenv('LIMIT_CONCURRENCY', 1000)
    LIMIT_MAX_REQUESTS: int = os.getenv('LIMIT_MAX_REQUESTS', 10000)
    GRACEFUL_SHUTDOWN: int = os.getenv('GRACEFUL_SHUTDOWN', 30)


    # OpenAI settings
    OPENAI_API_KEY: str = os.getenv('OPENAI_API_KEY', '')

    # Voyage AI settings
    VOYAGE_API_KEY: str = os.getenv('VOYAGE_API_KEY', '')

    # ChromaDB settings
    CHROMA_PERSIST_DIR: str = os.getenv('CHROMA_PERSIST_DIR', './chroma_data')

    # Scraping settings
    ZENROWS_API_KEY: str = os.getenv('ZENROWS_API_KEY', '')


    # ChromaDB persist directory
    PROTOBUF_FIXED: bool = os.getenv('PROTOBUF_FIXED', False)
    PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION: str = os.getenv('PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION', 'python')

    # Debug settings
    DEBUG_LOGS: bool = os.getenv('DEBUG_LOGS', False)
    LOG_REQUEST_BODY: bool = os.getenv('LOG_REQUEST_BODY', True)

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()