# Research and Paper

Search academic databases and generate APA 7 papers using AI — right inside Obsidian.

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue?logo=paypal)](https://paypal.me/jesusgarciapsi)

## Quick start

1. Install from **Community Plugins** → search "Research and Paper"
2. Enable it in Settings → Community Plugins
3. Open Settings → Research and Paper, pick an LLM provider, paste your API key
4. Open a note, click the 🔍 ribbon icon, and start researching

The plugin auto-detects your Obsidian language.

## LLM Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5.5, GPT-5.4, GPT-5.4 Mini, GPT-5.4 Nano, GPT-5.2 |
| Anthropic | Claude Opus 4.7, Sonnet 4.6, Haiku 4.5 |
| DeepSeek | V4 Pro, V4 Flash |
| Google Gemini | 2.5 Pro, 2.5 Flash, 2.5 Flash Lite |
| OpenRouter | Routes to all major models |
| Grok (xAI) | Grok 4.3, Grok 4.20 Reasoning |
| GLM (Z.ai) | GLM-4 Plus, GLM-4, GLM-4 Flash, GLM-4 Air |

## Tutorial

### 1. Configure your LLM provider

Go to **Settings → Research and Paper**. Select your provider (e.g., OpenAI), paste your API key, and pick a model. GPT-5.5 and Claude Opus 4.7 produce the best academic papers.

Optionally, add a **PubMed API Key** (free, increases search rate limits) and your **email** for Crossref polite pool.

### 2. Search for evidence

Open a note, click the 🔍 ribbon icon or run `Ctrl+P → Research and Paper: buscar y generar`. Type your research question in natural language:

> *"What's the evidence on CBT for generalized anxiety disorder?"*

> *"¿Qué dice la literatura sobre terapia cognitivo-conductual en adolescentes con depresión?"*

Select your **domain** (Psychology, Medicine, or General) and **mode** (Quick Answer or Full APA 7 Paper).

### 3. Review and refine

After searching, you'll see a list of papers. Each one is pre-selected with a checkbox:

- **Uncheck** papers that aren't relevant to your focus
- Use the **Extra instructions** field to guide the AI in natural language:
  - *"Focus on efficacy compared to pharmacotherapy"*
  - *"Only include randomized controlled trials"*
  - *"Compare the approaches and highlight methodological differences"*

### 4. Generate your paper

Click **Generate quick answer** or **Draft full paper**. The result is inserted into your note inside a foldable callout block.

## Features

- **Natural language search** — PubMed and OpenAlex handle colloquial queries
- **Review & Refine** — select exactly which papers to include, add custom instructions
- **APA 7 formatting** — bilingual titles, abstracts, keywords, in-text citations
- **Model selector** — 30+ models across 7 providers, updated for 2026
- **PubMed abstracts** — full abstracts fetched via EFetch API for better context
- **Two modes** — quick evidence-based answer or full academic paper

## Search sources

| Database | Coverage | Requires |
|----------|----------|----------|
| PubMed | Biomedical & clinical, high rigor | None (API key optional) |
| OpenAlex | Multi-disciplinary, 250M+ works | None |

## Support

Research and Paper is free and open source. If it helps your academic work, consider supporting development:

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue?logo=paypal)](https://paypal.me/jesusgarciapsi)

## Credits

Created by **Jesús García** & **DeepSeek V4-Pro** · [GitHub](https://github.com/jaliriogbarrios19)
