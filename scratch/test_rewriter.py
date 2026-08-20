import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from src.db.models import Article, get_session
from src.ai.rewriter import rewrite_article

with get_session() as session:
    article = session.query(Article).first()
    if article:
        print(f"Testing rewrite on Article #{article.id}: '{article.title}'...")
        res = rewrite_article(article.id)
        print(f"Rewrite result: {res}")
    else:
        print("No articles found in DB.")
