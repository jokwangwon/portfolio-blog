from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_provider: str = "ollama"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "gemma3:12b"
    notion_api_key: str = ""
    port: int = 8081

    class Config:
        env_prefix = ""
        env_file = ".env"
        extra = "ignore"


settings = Settings()
