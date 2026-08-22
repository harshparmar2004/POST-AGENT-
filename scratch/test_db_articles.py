"""
Test DB query for list_articles to find root cause of HTTP 500.
"""

import traceback
from src.db.models import Article, get_session, init_db

try:
    init_db()
    with get_session() as session:
        articles = session.query(Article).all()
        print(f"Successfully retrieved {len(articles)} articles from database.")
        for a in articles[:3]:
            print(f"Article #{a.id}: {a.title[:40]} | rank_score={getattr(a, 'rank_score', None)}")
except Exception as e:
    print("❌ ERROR QUERYING ARTICLES:")
    traceback.print_exc()
