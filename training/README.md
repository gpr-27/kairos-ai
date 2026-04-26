# `training/` — Fine-tuning workspace

> **Status:** placeholder. Week 3 of the [roadmap](../docs/ROADMAP.md).

This folder will hold the data-collection, preprocessing, and fine-tuning code for Kairos's own coaching model — a **Qwen 2.5 1.5B** model trained with **QLoRA** on free Kaggle T4 GPUs.

## Why fine-tune at all?

Groq's hosted Llama-3.3-70B is great as a Day 1 brain, but:

- It's **somebody else's API** — rate-limited, censorable, can disappear.
- It's **not specialized** for coaching — it'll happily dump full solutions when asked.
- We can do better with **a smaller model trained on the right data** for ~$0.

The goal: a 1.5B model that beats Groq's 70B on **coaching-style metrics** (hint quality, Socratic depth, refusal-to-spoon-feed) while running on free ZeroGPU.

## Planned structure

```
training/
├── data/
│   ├── raw/                    Raw collected pairs (gitignored)
│   ├── processed/              Cleaned, deduped, chat-formatted (gitignored)
│   └── splits/                 train/val/test JSONL (DVC-tracked)
├── notebooks/
│   ├── 01_collect.ipynb        Scrape + dedupe LeetCode discuss + CF editorials
│   ├── 02_clean.ipynb          PII removal, formatting, length filtering
│   ├── 03_label.ipynb          Intent labels (hint / explain / debug / review)
│   └── 04_eda.ipynb            Distribution checks
├── scripts/
│   ├── collect.py
│   ├── clean.py
│   ├── format_chatml.py
│   └── eval.py                 Held-out + LLM-judge eval
├── kaggle/
│   ├── train_sft.ipynb         QLoRA SFT on Kaggle T4 (free)
│   └── train_dpo.ipynb         DPO with rejected/chosen pairs
├── configs/
│   ├── sft_qwen_1_5b.yaml
│   └── dpo_qwen_1_5b.yaml
└── eval/
    ├── prompts.json            Held-out coaching scenarios
    └── rubric.md               6-axis grading rubric
```

## Pipeline

```
1. Collect      ── ~5k (problem, student-attempt, ideal-coach-reply) triples
       ↓
2. Clean        ── dedupe, PII strip, length filter, intent label
       ↓
3. Format       ── ChatML with system / user / assistant roles
       ↓
4. SFT (QLoRA)  ── Qwen 2.5 1.5B base + LoRA adapters, 3-5 epochs on T4
       ↓
5. DPO          ── Pairs of (good hint, bad spoon-feed) to reinforce coaching
       ↓
6. Push to Hub  ── praneethg27/kairos-coach-1.5b-v1
       ↓
7. Deploy       ── HF Space (ZeroGPU) → apps/ml/llm/hf_space_provider.py
```

## Data sources (planned, all open / fair-use)

- **LeetCode Discuss** (Apache 2.0 scrapers exist) — accepted hint-style answers
- **Codeforces editorials** (CC-BY) — author-written explanations
- **AtCoder editorials** (open) — clean, well-structured
- **Manually curated** — 200–500 of our own gold examples for the test set
- **Synthetic** (carefully) — Groq-generated hints reviewed by hand

## Honest disclaimer

Until this folder has actual code, the project uses **Groq Llama-3.3-70B**.
The provider abstraction in `apps/ml/app/llm/` makes switching trivial when the model is ready.

See [`docs/ROADMAP.md`](../docs/ROADMAP.md#week-3--fine-tuning--own-model) for the timeline.
