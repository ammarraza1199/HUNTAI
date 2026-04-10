"""
utils/retry_handler.py — Generic retry logic with exponential backoff.
Wraps any callable, logs each attempt, returns None on total failure.
"""

import time
import logging
import functools
import random
from typing import Any, Callable, Optional, TypeVar

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


def with_retry(
    attempts: int = 3,
    backoff: list[float] | None = None,
    exceptions: tuple[type[Exception], ...] = (Exception,),
    jitter: bool = True,
) -> Callable[[F], F]:
    """
    Decorator factory that retries a function on failure.

    Args:
        attempts:   Maximum number of attempts (including the first).
        backoff:    List of wait times (seconds) between retries.
                    Falls back to [2, 4, 8] if not provided.
        exceptions: Tuple of exception types to catch and retry on.
        jitter:     If True, add ±20 % random jitter to each backoff value.

    Returns:
        A decorator that wraps the target function with retry logic.

    Example::

        @with_retry(attempts=3, backoff=[2, 4, 8])
        def fetch_page(url: str) -> str:
            ...
    """
    if backoff is None:
        backoff = [2.0, 4.0, 8.0]

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exception: Optional[Exception] = None
            for attempt in range(1, attempts + 1):
                try:
                    result = func(*args, **kwargs)
                    if attempt > 1:
                        logger.info(
                            "✅ %s succeeded on attempt %d/%d",
                            func.__name__, attempt, attempts,
                        )
                    return result
                except exceptions as exc:
                    last_exception = exc
                    logger.warning(
                        "⚠️  %s failed on attempt %d/%d — %s: %s",
                        func.__name__, attempt, attempts,
                        type(exc).__name__, exc,
                    )
                    if attempt < attempts:
                        wait = backoff[min(attempt - 1, len(backoff) - 1)]
                        if jitter:
                            wait *= random.uniform(0.8, 1.2)
                        logger.info(
                            "   Retrying in %.1f seconds...", wait
                        )
                        time.sleep(wait)
            logger.error(
                "❌ %s failed after %d attempts. Last error: %s",
                func.__name__, attempts, last_exception,
            )
            return None

        return wrapper  # type: ignore[return-value]

    return decorator


def retry_call(
    func: Callable[..., Any],
    *args: Any,
    attempts: int = 3,
    backoff: list[float] | None = None,
    exceptions: tuple[type[Exception], ...] = (Exception,),
    jitter: bool = True,
    **kwargs: Any,
) -> Any:
    """
    Functional (non-decorator) interface for retry logic.

    Useful when you cannot decorate the function directly (e.g., lambdas,
    third-party functions, or when you need per-call configuration).

    Args:
        func:       The callable to retry.
        *args:      Positional arguments forwarded to *func*.
        attempts:   Maximum number of attempts.
        backoff:    List of wait times between retries in seconds.
        exceptions: Exception types to catch.
        jitter:     Add random jitter to backoff waits.
        **kwargs:   Keyword arguments forwarded to *func*.

    Returns:
        Return value of *func* on success, or ``None`` on total failure.

    Example::

        result = retry_call(requests.get, url, timeout=10, attempts=3)
    """
    if backoff is None:
        backoff = [2.0, 4.0, 8.0]

    last_exception: Optional[Exception] = None
    for attempt in range(1, attempts + 1):
        try:
            return func(*args, **kwargs)
        except exceptions as exc:
            last_exception = exc
            logger.warning(
                "⚠️  retry_call(%s) attempt %d/%d — %s: %s",
                getattr(func, "__name__", str(func)),
                attempt, attempts,
                type(exc).__name__, exc,
            )
            if attempt < attempts:
                wait = backoff[min(attempt - 1, len(backoff) - 1)]
                if jitter:
                    wait *= random.uniform(0.8, 1.2)
                time.sleep(wait)

    logger.error(
        "❌ retry_call(%s) exhausted %d attempts. Last: %s",
        getattr(func, "__name__", str(func)), attempts, last_exception,
    )
    return None
