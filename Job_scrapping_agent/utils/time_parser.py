"""
utils/time_parser.py — Normalise relative job-posting timestamps to hours.

Handles all timestamp formats found on LinkedIn, Indeed, and Naukri:
  "Just posted", "2 hours ago", "1 day ago", "Few hours ago", "Today", etc.

Returns a dict with:
  raw       – original string as-is
  hours     – float representing age in hours (0 = just now)
  abs_utc   – ISO-8601 UTC timestamp string
  is_recent – True if hours <= config.FILTER_MAX_HOURS
  is_fresh  – True if hours <= config.FILTER_PREFER_HOURS (preferred)
  unknown   – True if the timestamp could not be parsed
"""

import re
import logging
from datetime import datetime, timezone, timedelta
from typing import TypedDict

import config

logger = logging.getLogger(__name__)


class ParsedTime(TypedDict):
    """Return type for parse_posted_time."""
    raw: str
    hours: float
    abs_utc: str
    is_recent: bool
    is_fresh: bool
    unknown: bool


# ─── Normalisation Patterns ────────────────────────────────────────────────────
# Each entry: (regex_pattern, hours_value_or_None)
# None means we need to extract the numeric value from the match.
_PATTERNS: list[tuple[re.Pattern[str], float | None]] = [
    # "just now", "moments ago", "just posted", "active just now"
    (re.compile(r"\b(just\s+now|just\s+posted|moments?\s+ago|right\s+now)\b", re.I), 0.0),

    # "X minutes ago" / "X mins ago"
    (re.compile(r"(\d+)\s+min(?:ute)?s?\s+ago", re.I), None),   # capture group → /60

    # "X hours ago" / "Xh ago"
    (re.compile(r"(\d+)\s*h(?:our)?s?\s+ago", re.I), None),     # capture group → verbatim

    # "few hours ago" / "few minutes ago" → conservative estimate 2 hours
    (re.compile(r"\bfew\s+(hour|min)", re.I), 2.0),

    # "today" → treat conservatively as 1 hour
    (re.compile(r"\btoday\b", re.I), 1.0),

    # "X days ago" / "1 day ago"
    (re.compile(r"(\d+)\s+days?\s+ago", re.I), None),           # capture group → *24

    # "30+ days ago", "over 30 days" → very old
    (re.compile(r"(\d+)\+\s+days?\s+ago", re.I), None),         # capture group → *24

    # "1 day ago" (no number variant — "a day ago")
    (re.compile(r"\ba\s+day\s+ago\b", re.I), 24.0),

    # "an hour ago" / "a hour ago"
    (re.compile(r"\ban?\s+hour\s+ago\b", re.I), 1.0),

    # "a minute ago"
    (re.compile(r"\ba\s+minute\s+ago\b", re.I), 1 / 60),

    # "active X days ago" (LinkedIn profile-style)
    (re.compile(r"active\s+(\d+)\s+days?\s+ago", re.I), None),  # *24

    # "active X hours ago"
    (re.compile(r"active\s+(\d+)\s*h(?:our)?s?\s+ago", re.I), None),

    # "posted X days ago"
    (re.compile(r"posted\s+(\d+)\s+days?\s+ago", re.I), None),  # *24

    # "posted X hours ago"
    (re.compile(r"posted\s+(\d+)\s*h(?:our)?s?\s+ago", re.I), None),

    # "1 day" alone (Naukri sometimes drops "ago")
    (re.compile(r"^(\d+)\s+days?$", re.I), None),

    # "1 hour" alone
    (re.compile(r"^(\d+)\s*h(?:our)?s?$", re.I), None),
]

# Patterns where the captured number represents minutes
_MINUTE_PATTERNS: set[int] = {1}  # index into _PATTERNS for minute-based entries

# Patterns where the captured number represents days
_DAY_PATTERNS: set[int] = {5, 6, 7, 12, 13, 15}  # index into _PATTERNS for day-based


def _hours_from_match(pattern_index: int, match: re.Match[str]) -> float:
    """
    Convert a regex match to a float number of hours, based on the
    unit implied by the pattern at *pattern_index*.
    """
    raw_value = float(match.group(1))
    if pattern_index in _MINUTE_PATTERNS:
        return raw_value / 60.0
    if pattern_index in _DAY_PATTERNS:
        return raw_value * 24.0
    return raw_value


def _utc_from_hours(hours: float) -> str:
    """Return an ISO-8601 UTC string *hours* ago from now."""
    dt = datetime.now(timezone.utc) - timedelta(hours=hours)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_posted_time(raw_text: str) -> ParsedTime:
    """
    Parse a raw posted-time string from any supported platform.

    Args:
        raw_text: E.g. "2 hours ago", "Just posted", "1 day ago", "Few hours ago"

    Returns:
        ParsedTime dict with keys: raw, hours, abs_utc, is_recent, is_fresh, unknown
    """
    if not raw_text or not raw_text.strip():
        return _unknown_result("")

    text = raw_text.strip()

    for idx, (pattern, fixed_hours) in enumerate(_PATTERNS):
        match = pattern.search(text)
        if match:
            if fixed_hours is not None:
                hours = fixed_hours
            else:
                try:
                    hours = _hours_from_match(idx, match)
                except (IndexError, ValueError):
                    logger.debug("Could not extract numeric value from '%s'", text)
                    continue

            logger.debug("Parsed '%s' → %.2f hours (pattern %d)", text, hours, idx)
            return _build_result(raw_text, hours)

    # Could not parse — mark as unknown
    logger.debug("Could not parse timestamp: '%s'", text)
    return _unknown_result(raw_text)


def _build_result(raw: str, hours: float) -> ParsedTime:
    """Build a fully populated ParsedTime from raw text and computed hours."""
    return ParsedTime(
        raw=raw,
        hours=round(hours, 4),
        abs_utc=_utc_from_hours(hours),
        is_recent=hours <= config.FILTER_MAX_HOURS,
        is_fresh=hours <= config.FILTER_PREFER_HOURS,
        unknown=False,
    )


def _unknown_result(raw: str) -> ParsedTime:
    """Build a ParsedTime for an unrecognised timestamp."""
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return ParsedTime(
        raw=raw,
        hours=float("inf"),
        abs_utc=now_utc,
        is_recent=False,
        is_fresh=False,
        unknown=True,
    )


def is_within_hours(hours: float, limit: int = 24) -> bool:
    """
    Return True if *hours* is within *limit* hours.

    Args:
        hours: Age of the posting in hours (use parsed_time["hours"]).
        limit: Maximum acceptable age. Defaults to 24.
    """
    return hours <= limit


def filter_recent_jobs(jobs: list[dict], max_hours: int | None = None) -> list[dict]:
    """
    Filter a list of job dicts, keeping only those within *max_hours*.
    Jobs with unknown timestamps are retained with a warning flag.

    Each job dict must have ``posted_hours`` and ``posted_raw`` keys.

    Args:
        jobs:      List of job dicts.
        max_hours: Age cutoff. Defaults to config.FILTER_MAX_HOURS.

    Returns:
        Filtered list of job dicts.
    """
    cutoff = max_hours if max_hours is not None else config.FILTER_MAX_HOURS
    kept, dropped, unknown_count = [], 0, 0

    for job in jobs:
        hours = job.get("posted_hours", float("inf"))
        if hours == float("inf"):
            unknown_count += 1
            job["timestamp_unknown"] = True
            kept.append(job)
        elif hours <= cutoff:
            job["timestamp_unknown"] = False
            kept.append(job)
        else:
            dropped += 1

    logger.info(
        "⏱  Time filter: kept %d, dropped %d (>%dh), unknown %d",
        len(kept), dropped, cutoff, unknown_count,
    )
    return kept
