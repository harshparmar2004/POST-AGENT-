"""
Database models and session factory for the news auto-pipeline.
Uses SQLAlchemy 2.0+ with typed Mapped columns and SQLite backend.
"""

import os
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
    create_engine,
    func,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    Session,
    mapped_column,
    sessionmaker,
)


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


# ---------------------------------------------------------------------------
# Article model
# ---------------------------------------------------------------------------

class Article(Base):
    """
    Central table that tracks every article through the pipeline:
      scraped → ready → published / queued
    """

    __tablename__ = "articles"

    # --- Identity ---
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    url_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # SHA-256 of URL
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)

    # --- Original content ---
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author: Mapped[str | None] = mapped_column(String(200), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # --- AI-generated content (4 platforms) ---
    twitter_text: Mapped[str | None] = mapped_column(Text, nullable=True)         # ≤280 chars, text-only
    linkedin_text: Mapped[str | None] = mapped_column(Text, nullable=True)        # professional tone
    instagram_caption: Mapped[str | None] = mapped_column(Text, nullable=True)    # with hashtags
    reddit_title: Mapped[str | None] = mapped_column(String(300), nullable=True)  # informative
    reddit_body: Mapped[str | None] = mapped_column(Text, nullable=True)          # discussion-sparking
    image_path: Mapped[str | None] = mapped_column(Text, nullable=True)           # path to generated PNG

    # --- Workflow ---
    status: Mapped[str] = mapped_column(String(20), default="scraped")
    #   scraped  → article text in DB, no AI content yet
    #   ready    → AI rewrite + image done
    #   published → posted to live platforms
    #   queued   → saved to local queue folders
    #   failed   → something went wrong (check logs)

    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subreddit: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- Per-platform posting status ---
    reddit_posted: Mapped[bool] = mapped_column(Boolean, default=False)
    twitter_posted: Mapped[bool] = mapped_column(Boolean, default=False)
    instagram_queued: Mapped[bool] = mapped_column(Boolean, default=False)
    linkedin_queued: Mapped[bool] = mapped_column(Boolean, default=False)

    def __repr__(self) -> str:
        return (
            f"<Article(id={self.id}, source='{self.source}', "
            f"title='{self.title[:40]}…', status='{self.status}')>"
        )


class PipelineRun(Base):
    """
    Tracks pipeline batch execution history for scalability and logging:
      started_at, completed_at, status, counts per stage, duration.
    """

    __tablename__ = "pipeline_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="running")  # running, completed, failed
    articles_scraped: Mapped[int] = mapped_column(Integer, default=0)
    articles_rewritten: Mapped[int] = mapped_column(Integer, default=0)
    images_generated: Mapped[int] = mapped_column(Integer, default=0)
    published_count: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[float] = mapped_column(Integer, default=0.0)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "status": self.status,
            "articles_scraped": self.articles_scraped,
            "articles_rewritten": self.articles_rewritten,
            "images_generated": self.images_generated,
            "published_count": self.published_count,
            "duration_seconds": self.duration_seconds
        }


# ---------------------------------------------------------------------------
# Engine & session helpers
# ---------------------------------------------------------------------------

# Database file lives at project root
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DB_PATH = os.path.join(_PROJECT_ROOT, "pipeline.db")
_DB_URL = f"sqlite:///{_DB_PATH}"

_engine = create_engine(_DB_URL, echo=False)
_SessionFactory = sessionmaker(bind=_engine, expire_on_commit=False)


def init_db() -> None:
    """Create all tables if they don't already exist."""
    Base.metadata.create_all(_engine)


def get_session() -> Session:
    """
    Return a new SQLAlchemy session.
    
    Supports both context-manager and manual usage:
        # Context manager (preferred):
        with get_session() as session:
            ...
        
        # Manual:
        session = get_session()
        try:
            ...
        finally:
            session.close()
    """
    return _SessionFactory()
