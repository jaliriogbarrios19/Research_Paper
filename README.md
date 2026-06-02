# Research Paper

AI-assisted research briefs from academic databases — right inside Obsidian.

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue?logo=paypal)](https://paypal.me/jesusgarciapsi)

## Quick start

1. Install from **Community Plugins** → search "Research Paper"
2. Enable it in Settings → Community Plugins
3. Open Settings → Research Paper, pick an LLM provider, paste your API key
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
| **Smart Plugins Obsidian (spob)** | **DeepSeek V4 Pro, V4 Flash** |

> **spob** es el proveedor por defecto. [Obtené tu API key](https://spob-backend.fly.dev) y empezá a generar briefs con DeepSeek al instante — sin configurar nada más.

## Tutorial

### 1. Configure your LLM provider

Go to **Settings → Research Paper**. Select your provider (e.g., OpenAI), paste your API key, and pick a model. GPT-5.5 and Claude Opus 4.7 produce the best results.

Optionally, add a **PubMed API Key** (free, increases search rate limits) and your **email** for Crossref DOI verification.

### 2. Search for evidence

Open a note, click the 🔍 ribbon icon or run `Ctrl+P → Research Paper: buscar y generar`. Type your research question in natural language — the LLM optimizes it into academic keywords automatically:

> *"What's the evidence on CBT for generalized anxiety disorder?"*

> *"¿Qué dice la literatura sobre terapia cognitivo-conductual en adolescentes con depresión?"*

Choose your **domain** (10 options, from Psychology to Engineering), **mode** (Quick Answer or Research Brief), **language** for the output, and a **year range** filter.

### 3. Review and refine

After searching, you'll see a list of articles with relevance scores. Each one is pre-selected with a checkbox:

- **Uncheck** articles that aren't relevant to your focus
- Use the **Extra instructions** field to guide the AI in natural language:
  - *"Focus on efficacy compared to pharmacotherapy"*
  - *"Only include randomized controlled trials"*

### 4. Generate your brief

Click **Generate brief**. The output is a structured Research Brief inserted into your note:

```
## Research Brief: {Title}

⚠️ AI-assisted brief. All factual data is traceable to the listed sources.

### Research Question
{Your original query}

### Sources Consulted
1. Smith, J. et al. (2025). *Journal*. DOI: [10.xxx](https://doi.org/10.xxx)
   {Summary in your language}

### Findings per Source
→ Smith et al. (2025) found that...

### Convergences
• Both studies agree that... (Smith, 2025; García, 2024)

### Divergences
• Smith reports a large effect; García reports moderate...

### Implications
{AI-generated synthesis}
⚠️ This section is AI-generated synthesis.
```

## Features

- **Natural language search** — optimized into academic keywords by LLM
- **Three search sources** — PubMed (biomedical domains), OpenAlex, and Semantic Scholar (214M+ papers)
- **Research Brief format** — traceable evidence, not fake papers. No fabricated Methods, no false claims
- **Review & Refine** — select exactly which articles to include, add custom instructions
- **APA 7 in-text citations** — consistent author-year format throughout
- **DOI verification** — validates against Crossref API
- **Year range filter** — All time / Last 3 / 5 / 10 / 20 years
- **10 research domains** — Psychology, Medicine, Nursing, Biology, Education, Sociology, Economics, Law, Engineering, General
- **6 output languages** — with mandatory English abstract
- **Model selector** — 30+ models across 7 providers, updated for 2026

## Search sources

| Database | Coverage | Requires |
|----------|----------|----------|
| PubMed | Biomedical & clinical | None (API key optional) |
| OpenAlex | Multi-disciplinary, 250M+ works | None |
| Semantic Scholar | Multi-disciplinary, 214M+ papers | None |

## Support

Research Paper is free and open source. If it helps your academic work, consider supporting development:

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue?logo=paypal)](https://paypal.me/jesusgarciapsi)

## Credits

Created by **Jesús García** & **DeepSeek V4-Pro** · [GitHub](https://github.com/jaliriogbarrios19/Research_Paper)
