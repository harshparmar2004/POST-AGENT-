#!/usr/bin/env python3
"""
News Auto-Pipeline — CLI Entry Point

Usage:
    python run.py                    # Run full pipeline (default: 10 articles/source)
    python run.py --max-articles 3   # Limit to 3 articles per source/stage
    python run.py --max-articles 1   # Minimal test run

Runs the complete pipeline once:
  Scrape → Rewrite → Image Gen → Publish/Queue
"""

import os
import sys
import argparse
import logging
from pathlib import Path

from dotenv import load_dotenv


def setup_logging() -> None:
    """Configure dual logging: console (INFO+) and file (DEBUG+)."""
    # Ensure logs directory exists
    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(exist_ok=True)
    log_file = log_dir / "pipeline.log"

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Console handler — INFO and above
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_fmt = logging.Formatter(
        "%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
        datefmt="%H:%M:%S",
    )
    console_handler.setFormatter(console_fmt)

    # File handler — DEBUG and above
    file_handler = logging.FileHandler(str(log_file), encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_fmt = logging.Formatter(
        "%(asctime)s │ %(levelname)-7s │ %(name)s │ %(funcName)s:%(lineno)d │ %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_fmt)

    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    # Suppress noisy third-party loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("feedparser").setLevel(logging.WARNING)
    logging.getLogger("trafilatura").setLevel(logging.WARNING)
    logging.getLogger("newspaper").setLevel(logging.WARNING)
    logging.getLogger("praw").setLevel(logging.WARNING)
    logging.getLogger("tweepy").setLevel(logging.WARNING)
    logging.getLogger("google").setLevel(logging.WARNING)


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="News Auto-Pipeline — Scrape → Rewrite → Image Gen → Publish",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run.py                     Run full pipeline
  python run.py --max-articles 3    Limit to 3 articles per source (good for testing)
  python run.py --max-articles 1    Minimal test run (1 article per source)
        """,
    )
    parser.add_argument(
        "--max-articles",
        type=int,
        default=None,
        help="Max articles to process per source/stage (default: no limit, uses per-source config)",
    )
    return parser.parse_args()


def check_env() -> None:
    """Check that at least one LLM provider key is set."""
    logger = logging.getLogger(__name__)

    llm_keys = ["GOOGLE_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
    found_llm = any(os.getenv(k) and not os.getenv(k).startswith("your_") for k in llm_keys)

    if not found_llm:
        logger.warning("No LLM API Key found in .env! (Set GROQ_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY)")
        logger.warning("Copy .env.example to .env or configure keys in the Dashboard UI at http://localhost:8000/#settings")

    # Check optional keys (warn but don't exit)
    missing_optional = []
    for key, purpose in optional.items():
        if not os.getenv(key):
            missing_optional.append(f"  {key} ({purpose})")

    if missing_optional:
        logger.warning("Missing optional credentials (those platforms will be skipped):")
        for m in missing_optional:
            logger.warning(m)


def main() -> None:
    """Main entry point."""
    # Change to project root directory
    project_root = Path(__file__).parent
    os.chdir(project_root)

    # Load environment variables
    load_dotenv()

    # Setup logging
    setup_logging()
    logger = logging.getLogger(__name__)

    # Parse CLI args
    args = parse_args()

    # Check environment
    check_env()

    # Ensure required directories exist
    for dir_name in ["images", "logs", "queue/instagram", "queue/linkedin"]:
        (project_root / dir_name).mkdir(parents=True, exist_ok=True)

    # Run the pipeline
    try:
        from src.orchestrator import run_pipeline
        run_pipeline(max_articles=args.max_articles)
    except KeyboardInterrupt:
        logger.info("Pipeline interrupted by user (Ctrl+C)")
        sys.exit(0)
    except Exception as e:
        logger.exception(f"Pipeline failed with error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
