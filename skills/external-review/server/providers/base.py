"""Abstract base class for LLM providers."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ReviewResponse:
    status: str  # "success" | "error"
    response: str | None = None
    error: str | None = None
    tokens_used: dict | None = None
    latency_ms: int = 0
    retries_attempted: int = 0


class BaseProvider(ABC):
    """Abstract base class for LLM providers."""

    def __init__(self, endpoint: str, api_key: str, **kwargs):
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key

    @abstractmethod
    async def review(
        self,
        artifact_content: str,
        prompt: str,
        model: str,
        settings: dict | None = None,
        extra_params: dict | None = None,
    ) -> ReviewResponse:
        """Send review request to provider."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Verify API connectivity."""
        ...
