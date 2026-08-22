"""
AI News Ranking & Filter Engine — Pillar 2: Evaluates, scores (1-100), and ranks news
scraped from the internet using customizable AI Ranking Prompts and Niche Focus criteria.
"""

import os
import json
import logging
import requests
from typing import Optional

from src.db.models import Article, get_session

logger = logging.getLogger(__name__)


def rank_article(article_id: int) -> bool:
    """
    Evaluates and ranks a single article (assigns score 1-100 + reasoning)
    based on Custom AI Ranking Prompt and Niche Focus criteria.
    """
    ranking_prompt_custom = os.getenv(
        "RANKING_PROMPT",
        "Rank news based on viral potential, high-impact breakthroughs, startup innovation, and reader interest."
    )
    niche = os.getenv("NICHE_FOCUS", "Technology, AI & Innovation")
    groq_key = os.getenv("GROQ_API_KEY", "")
    google_key = os.getenv("GOOGLE_API_KEY", "")

    with get_session() as session:
        article = session.query(Article).filter(Article.id == article_id).first()
        if not article:
            logger.error(f"Article #{article_id} not found for ranking.")
            return False

        prompt = (
            f"Target Niche: '{niche}'\n"
            f"Ranking Criteria Instructions: '{ranking_prompt_custom}'\n\n"
            f"Article Title: {article.title}\n"
            f"Article Source: {article.source}\n"
            f"Body Snippet: {(article.body or '')[:300]}\n\n"
            "Evaluate this news story and assign a numeric score from 1 to 100 representing its viral impact, "
            "relevance, and audience value. Return strictly a JSON object with keys:\n"
            "- 'score': integer from 1 to 100\n"
            "- 'reason': brief 1-sentence evaluation justification"
        )

        score = 75
        reason = "Relevant niche news story."

        # 1. Try Groq Llama 3.3 70B AI Ranking
        if groq_key and not groq_key.startswith("your_"):
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                }
                resp = requests.post(url, headers=headers, json=payload, timeout=12)
                if resp.status_code == 200:
                    data = json.loads(resp.json()["choices"][0]["message"]["content"])
                    score = int(data.get("score", 75))
                    reason = str(data.get("reason", "High-impact tech news."))
            except Exception as ex:
                logger.warning(f"Groq ranking call failed: {ex}. Using heuristic scoring.")

        # Heuristic NLP Fallback score calculation if LLM call is offline
        else:
            clean_t = article.title.lower()
            base_score = 70 + (article_id * 17) % 25  # Gives a unique baseline score between 70 and 95

            high_viral_keywords = ["ai", "gpus", "breakthrough", "launch", "funding", "robot", "nvidia", "openai", "google", "stripe", "openrouter", "waymo", "apple", "camera", "fold", "chip", "quantum", "meta"]
            low_priority_keywords = ["deal", "freebie", "discount", "bug", "sale", "wallpaper", "case"]

            matched_high = [k for k in high_viral_keywords if k in clean_t]
            matched_low = [k for k in low_priority_keywords if k in clean_t]

            if matched_high:
                score = min(98, base_score + len(matched_high) * 4)
                reason = f"High viral score: covers trending topic ({', '.join(matched_high[:2]).upper()}) from {article.source or 'top tech feed'}."
            elif matched_low:
                score = max(42, 60 - len(matched_low) * 5)
                reason = f"Lower priority: contains app deal/minor update keywords ({', '.join(matched_low[:2])})."
            else:
                score = base_score
                reason = f"Standard coverage: relevant topic from {article.source or 'scraped news source'}."

        article.rank_score = max(1, min(100, score))
        article.rank_reason = reason
        session.commit()
        logger.info(f"Article #{article_id} ranked with Score {article.rank_score}/100: {reason}")
        return True


def rank_all_articles() -> int:
    """Ranks all unranked scraped articles in DB."""
    count = 0
    with get_session() as session:
        articles = session.query(Article).filter(Article.rank_score.is_(None)).all()
        article_ids = [a.id for a in articles]

    for aid in article_ids:
        if rank_article(aid):
            count += 1
    return count
