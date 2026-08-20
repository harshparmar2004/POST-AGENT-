# 📰 NewsFlow — News Auto-Pipeline & Dashboard

**Fully automated news aggregation, Gemini AI social media rewriting, thumbnail generation, multi-platform publishing, and professional dark-mode Web Dashboard.**

Scrapes news articles from 18+ sources → rewrites them with Gemini AI for 4 platforms → generates thumbnail images → posts to Reddit and Twitter live, queues Instagram and LinkedIn for manual posting, with full management via a high-performance web dashboard.

---

## 🎨 Web Dashboard Preview

Launch the web console to monitor stats, inspect social media rewrites, view generated thumbnails, manage local queues, view live terminal logs, and trigger pipeline runs with 1 click!

```bash
python dashboard.py
# Open: http://localhost:8000
```

---

## ✨ Key Features

- **Professional UI/UX Dashboard**: Dark mode glassmorphism theme built with FastAPI, Inter font, Lucide icons & Chart.js
- **Multi-tier scraping**: RSS/Atom feeds (fast, free) + ScrapeGraphAI for JS-heavy sites
- **AI-powered rewriting**: Gemini 2.5 Flash generates platform-optimized text
- **Thumbnail generation**: Gemini creates eye-catching images per article
- **Multi-platform publishing**:
  - ✅ **Reddit** — live posting with images
  - ✅ **Twitter/X** — live text-only tweets
  - 📁 **Instagram** — local queue for manual posting
  - 📁 **LinkedIn** — local queue for manual posting
- **Deduplication**: SHA-256 URL hashing prevents duplicate articles
- **robots.txt compliance**: Respects site crawling rules
- **SQLite database**: Tracks every article through the pipeline
- **$0 monthly cost**: All APIs on free tiers

---

## 🚀 Setup & Launch Guide

### 1. Clone & activate virtual environment

```bash
cd news-auto-pipeline
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
playwright install chromium
```

### 3. Configure API keys

```bash
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Edit `.env` and fill in your keys:

| Key | Where to get it | Required? |
|-----|----------------|-----------|
| `GOOGLE_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | **Yes** |
| `REDDIT_CLIENT_ID` | [Reddit Apps](https://www.reddit.com/prefs/apps) — "script" type | Optional |
| `REDDIT_CLIENT_SECRET` | Same as above | Optional |
| `REDDIT_USERNAME` | Your Reddit username | Optional |
| `REDDIT_PASSWORD` | Your Reddit password | Optional |
| `TWITTER_API_KEY` | [Twitter Developer Portal](https://developer.twitter.com/) | Optional |
| `TWITTER_API_SECRET` | Same as above | Optional |
| `TWITTER_ACCESS_TOKEN` | Same as above | Optional |
| `TWITTER_ACCESS_SECRET` | Same as above | Optional |

> **Note**: Only `GOOGLE_API_KEY` is required. If Reddit/Twitter keys are missing, those platforms are simply skipped.

---

### 4. Running the Dashboard or CLI

#### Launch Web Dashboard UI:
```bash
python dashboard.py
```
Open **`http://localhost:8000`** in your browser.

#### Run CLI Pipeline:
```bash
python run.py                     # Full run
python run.py --max-articles 2    # Test run
```

---

## 📁 Project Structure

```
news-auto-pipeline/
├── dashboard.py              # FastAPI Web Dashboard server
├── config/
│   └── sources.yaml          # 18 news sources (15 Tier 1, 3 Tier 2)
├── dashboard/
│   ├── index.html            # SPA UI Shell
│   ├── css/styles.css        # Glassmorphism dark mode CSS
│   └── js/
│       ├── app.js            # Core router & API client
│       └── pages/
│           ├── dashboard.js  # Stats & Chart.js graphs
│           ├── articles.js   # Searchable articles browser
│           ├── sources.js    # Sources grid
│           ├── queue.js      # Instagram & LinkedIn queue manager
│           └── logs.js       # Live log viewer
├── src/
│   ├── api/
│   │   └── routes.py         # FastAPI REST endpoints
│   ├── scraper/
│   │   ├── feed_scraper.py   # Tier 1: RSS + trafilatura + newspaper3k
│   │   ├── html_scraper.py   # Tier 1: Direct HTML scraping
│   │   ├── ai_scraper.py     # Tier 2: ScrapeGraphAI + Gemini
│   │   └── dedupe.py         # URL deduplication + DB insertion
│   ├── ai/
│   │   ├── rewriter.py       # Gemini 2.5 Flash — 4-platform rewrite
│   │   └── image_gen.py      # Gemini 2.0 Flash — thumbnail generation
│   ├── publishers/
│   │   ├── reddit_publisher.py    # Live posting via praw
│   │   ├── twitter_publisher.py   # Live text-only posting via tweepy
│   │   ├── instagram_publisher.py # Local queue (JSON + image)
│   │   └── linkedin_publisher.py  # Local queue (JSON + image)
│   ├── db/
│   │   └── models.py         # SQLAlchemy ORM (Article model)
│   └── orchestrator.py       # Pipeline coordinator
├── queue/
│   ├── instagram/            # Queued Instagram posts
│   └── linkedin/             # Queued LinkedIn posts
├── images/                   # Generated thumbnails
├── logs/
│   └── pipeline.log          # Detailed debug log
├── .env.example              # API key template
├── requirements.txt
└── run.py                    # CLI entry point
```

---

## 💰 Cost

| Component | Cost |
|-----------|------|
| Gemini API (text + image) | **$0** (free tier) |
| Reddit API | **$0** (free for scripts) |
| Twitter API | **$0** (free tier, text-only) |
| Web Dashboard UI | **$0** (local server) |
| **Total** | **$0/month** |

## 📜 License

MIT
