"""
Re-ranks all articles in the database with dynamic scores.
"""

from src.db.models import Article, get_session
from src.ai.ranker import rank_article

with get_session() as session:
    articles = session.query(Article).all()
    print(f"Re-ranking {len(articles)} articles...")
    for a in articles:
        rank_article(a.id)

print("✅ Re-ranking complete!")
