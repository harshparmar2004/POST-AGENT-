"""
Test image generation script for all scraped articles.
"""

from src.db.models import Article, get_session
from src.ai.image_gen import generate_image

with get_session() as session:
    articles = session.query(Article).all()
    print(f"Generating images for {len(articles)} articles...")
    success = 0
    for a in articles[:10]:
        if generate_image(a.id):
            success += 1

print(f"Finished: {success}/10 images created!")
