from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    gemini_api_key: str = Field(default=...)
    gemini_model: str = Field(default=...)
    groq_api_key: str = Field(default=...)
    groq_model: str = Field(default=...)
    redis_url: str = Field(default=...)
    database_url: str = Field(default=...)
    fire_crawl_api_key: str = Field(default=...)
    groq_min_interval_seconds: float = Field(default=1.25)
    groq_rate_limit_retries: int = Field(default=5)
    groq_retry_base_delay_seconds: float = Field(default=2.5)
    groq_retry_jitter_seconds: float = Field(default=1.0)

    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore", case_sensitive=False
    )


settings = Settings()
