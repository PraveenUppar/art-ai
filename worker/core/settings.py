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

    model_config = SettingsConfigDict(
        env_file=".env", extra="ignore", case_sensitive=False
    )


settings = Settings()
