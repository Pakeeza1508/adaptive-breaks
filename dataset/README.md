---
language:
- en
pretty_name: Kya Scene Hai Code-Mixed Cognitive State Dataset
license: cc-by-4.0
task_categories:
- text-classification
tags:
- roman-urdu
- code-mixed
- student
- cognitive-state
- micro-breaks
- adaptive-systems
---

# Kya Scene Hai — Code-Mixed Cognitive State Dataset

A small research dataset of short student/work statements in English, Roman Urdu, and Urdu-English code-mixed language.

The dataset represents **momentary non-clinical cognitive states** for an adaptive micro-break system.

## Intended task

Given a short user statement, predict:

- `energy`: `low`, `normal`, `high`
- `tension`: `low`, `medium`, `high`
- `attention`: `okay`, `scattered`, `stuck`
- `primary_state`: `drained`, `overwhelmed`, `distracted`, `stuck`

## Example

```json
{
  "seed_id": "stuck_003",
  "text": "same bug 40 mins se dekh raha hun",
  "language_style": "code_mixed",
  "energy": "normal",
  "tension": "medium",
  "attention": "stuck",
  "primary_state": "stuck",
  "source": "human_seed"
}
```

## Scope

This dataset is designed for:

- adaptive study/work break systems;
- multilingual/code-mixed text classification experiments;
- benchmarking structured LLM extraction;
- lightweight baseline classifiers.

It is **not** a mental-health diagnosis dataset.

Do not use it to infer psychiatric diagnoses, suicide risk, or clinical severity.

## Dataset construction

Version 0.1 begins with manually curated seed examples.

Planned expansion:

1. write balanced human seed examples;
2. generate controlled paraphrases with a language model;
3. retain the original `seed_id` for every paraphrase;
4. manually review generated text;
5. remove duplicates and unnatural Roman Urdu;
6. split train/validation/test by **seed group**, not individual sentence.

Grouping paraphrases by `seed_id` prevents near-duplicate paraphrases from leaking across train and test sets.

## Language styles

- `english`
- `roman_urdu`
- `code_mixed`

Roman Urdu has no single standardized spelling. Variation is intentional, but obviously artificial spellings should be removed during review.

## Label guide

### DRAINED

Typical signal: low energy / mental fatigue without a dominant overload or stuck-loop signal.

Typical representation:

- energy: low
- tension: low or medium
- attention: okay or mildly impaired

### OVERWHELMED

Typical signal: high tension, acute workload pressure, feeling overloaded.

Typical representation:

- tension: high
- attention may be scattered
- energy can vary

### DISTRACTED

Typical signal: attention repeatedly shifting or inability to stay on one target.

Typical representation:

- attention: scattered
- tension: low or medium
- energy: normal or high

### STUCK

Typical signal: attention locked on the same task/problem with no progress.

Typical representation:

- attention: stuck
- tension: medium in most examples
- energy may be normal or low

## Research basis

The project is motivated in part by:

Zhou et al. (2026), "Do micro-breaks between study sessions enhance Chinese university students' learning concentration?" Frontiers in Psychology. DOI: 10.3389/fpsyg.2026.1714389

The study identifies future directions including more detailed comparison of break types, cross-cultural work, and AI-driven personalized micro-break systems based on real-time student states.

A closely related 2026 conference paper is:

Vinesh et al. (2026), "Smart Break Recommendation System Based on Student Mental Fatigue and Task Type." DOI: 10.1109/ICSFT66733.2026.11507606

## Version

`0.1-seeds`

This version is intentionally small and should be treated as a starting dataset, not a production benchmark.
