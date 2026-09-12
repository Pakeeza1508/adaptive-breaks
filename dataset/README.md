language:

en
pretty_name: Kya Scene Hai Code-Mixed Cognitive State Dataset
license: cc-by-4.0
task_categories:

text-classification
tags:

roman-urdu

code-mixed

student

cognitive-state

micro-breaks

adaptive-systems

multilingual

Kya Scene Hai — Code-Mixed Cognitive State Dataset

A small research dataset of short study/work statements written in:

English

Roman Urdu

Urdu-English code-mixed language

The dataset represents momentary non-clinical cognitive/work states for an adaptive micro-break system.

It is part of the Kya Scene Hai? project.

Intended task

Given a short user statement, predict:

Energy

low

normal

high

Tension

low

medium

high

Attention

okay

scattered

stuck

Primary state

drained

overwhelmed

distracted

stuck

Example

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

Dataset schema

Field

Description

seed_id

ID of the original semantic seed group

variant_id

ID of a generated/reviewed variant where applicable

text

Natural-language user statement

language_style

english, roman_urdu, or code_mixed

energy

low, normal, or high

tension

low, medium, or high

attention

okay, scattered, or stuck

primary_state

drained, overwhelmed, distracted, or stuck

source

Human seed or generated/reviewed source

review_decision

Review status where present

Construction

Version 0.1 begins with 80 manually curated seed examples.

Balanced by primary_state:

20 Drained

20 Overwhelmed

20 Distracted

20 Stuck

Each seed is used to generate three controlled paraphrase candidates:

one English variant;

one Roman Urdu variant;

one Urdu-English code-mixed variant.

This produces:

80 human seed examples
+
240 generated candidates

The generated candidates are not blindly accepted.

They undergo:

deterministic quality checks;

structured LLM-assisted review;

project-team manual review before the public release.

The team review checks:

label consistency;

natural Pakistani student language;

Roman Urdu quality;

code-mixing quality;

accidental severity changes;

duplicates;

inappropriate clinical wording;

unnatural machine-translated phrasing.

Only accepted or corrected rows should be part of the final public release.

Language styles

English

Conversational English used during study/work.

Example:

I've been staring at the same bug for forty minutes.

Roman Urdu

Urdu expressed using the Latin alphabet.

Example:

dimagh isi problem pe atak gaya hai

Roman Urdu has no single standardized spelling.

Variation such as:

nahi
nai
nhi

can be natural and is not automatically treated as an error.

Code-mixed

Natural Urdu-English mixing.

Example:

I keep tab hopping, focus ka scene kharab hai

The goal is natural student language rather than formal translation.

Label guide

DRAINED

Dominant signal:

low mental energy or fatigue.

Typical structured state:

energy: low
tension: low or medium
attention: okay

OVERWHELMED

Dominant signal:

high tension, acute pressure, or overload.

Typical structured state:

tension: high
attention: okay or scattered
energy: variable

DISTRACTED

Dominant signal:

attention repeatedly shifts away from the intended task.

Typical structured state:

attention: scattered
tension: low or medium
energy: normal or high

STUCK

Dominant signal:

attention remains locked on the same task/problem with little progress.

Typical structured state:

attention: stuck
tension: commonly medium
energy: normal or low

Priority rule

When multiple signals occur together, the current labeling guide uses this approximate priority:

high tension / overload
        ↓
OVERWHELMED

else stuck loop
        ↓
STUCK

else scattered attention
        ↓
DISTRACTED

else low-energy dominant
        ↓
DRAINED

Ambiguous examples should be flagged for review rather than forced into a label.

Leakage prevention

This is a central methodological requirement.

Generated variants preserve the seed_id of the human statement from which they were derived.

Train, validation, and test sets are split by seed group, not individual row.

Therefore:

seed_001 original
seed_001 English paraphrase
seed_001 Roman Urdu paraphrase
seed_001 code-mixed paraphrase

must all remain in the same split.

This prevents near-duplicate paraphrase leakage from artificially inflating test performance.

Current experiment dataset

After exact normalized duplicate removal, the current benchmark contained:

314 total rows

80 unique seed groups

220 train rows

47 validation rows

47 test rows

The split is leakage-safe by seed_id.

The public release may differ slightly after final project-team review.

Initial benchmark

Three state-estimation approaches were compared:

deterministic rule baseline;

TF-IDF word/character features + Logistic Regression;

frozen multilingual-e5-small embeddings + Logistic Regression.

Primary-state results

Model

Accuracy

Macro-F1

TF-IDF + Logistic Regression

0.8511

0.8464

Rule-based baseline

0.6596

0.6263

multilingual-E5 + Logistic Regression

0.5957

0.5774

TF-IDF + Logistic Regression is currently the strongest trained baseline.

All target results

Model

Target

Accuracy

Macro-F1

Rules

Energy

0.7660

0.5008

Rules

Tension

0.5957

0.5067

Rules

Attention

0.4894

0.4975

Rules

Primary state

0.6596

0.6263

TF-IDF + LR

Energy

0.8936

0.6134

TF-IDF + LR

Tension

0.7021

0.7007

TF-IDF + LR

Attention

0.8511

0.8377

TF-IDF + LR

Primary state

0.8511

0.8464

multilingual-E5 + LR

Energy

0.5745

0.5229

multilingual-E5 + LR

Tension

0.6383

0.6400

multilingual-E5 + LR

Attention

0.7021

0.7049

multilingual-E5 + LR

Primary state

0.5957

0.5774

Macro-F1 is the preferred comparison metric.

Primary-state results by language style

TF-IDF + Logistic Regression

Language

Accuracy

Macro-F1

Code-mixed

0.9375

0.9365

Roman Urdu

0.8667

0.8532

English

0.7500

0.7183

multilingual-E5 + Logistic Regression

Language

Accuracy

Macro-F1

English

0.8125

0.8032

Code-mixed

0.5000

0.4675

Roman Urdu

0.4667

0.3745

Rule baseline

Language

Accuracy

Macro-F1

Code-mixed

0.7500

0.7143

Roman Urdu

0.6667

0.6181

English

0.5625

0.5137

An interesting initial observation is that character and word n-gram features perform strongly on the current Roman Urdu and code-mixed subsets.

Because the test set is small, these language-specific values should be treated as preliminary.

Evaluation methodology

Metrics:

Accuracy

Macro-F1

Weighted-F1

per-class precision

per-class recall

per-class F1

confusion matrices

Primary metric:

Macro-F1

The experiment also stores misclassified examples for error analysis.

Reproducibility

Training/evaluation script:

kaggle/train_and_compare.py

The Kaggle experiment produces:

final_dataset_with_split.csv
final_dataset_with_split.jsonl
metrics_summary.csv
primary_state_ranking.csv
language_breakdown.csv
experiment_summary.md

splits/
  train.csv
  validation.csv
  test.csv

models/
  rules/
  tfidf_logreg/
  e5_logreg/

The completed Kaggle runtime exposed:

2 × Tesla T4

The models used for the initial experiment are lightweight.

No large language model was fine-tuned.

Intended uses

Appropriate uses include:

adaptive study/work break research;

multilingual/code-mixed text classification;

structured state-extraction benchmarking;

Roman Urdu NLP experiments;

lightweight classifier baselines;

evaluation of LLM structured extraction.

Out-of-scope uses

This dataset is not intended for:

psychiatric diagnosis;

suicide-risk prediction;

depression screening;

ADHD diagnosis;

clinical severity estimation;

medical decision making;

employment screening;

educational punishment or high-stakes student profiling.

Safety

The dataset represents ordinary momentary work/study states, not clinical conditions.

High-risk distress language should be handled separately from the four normal state classes.

The Kya Scene Hai? application routes high-risk language outside its playful adaptive-break selection loop.

Limitations

The current dataset has important limitations:

small total size;

generated paraphrases are part of the working corpus;

the current test split is small;

Roman Urdu spelling is inherently variable;

the initial language/domain focus is Pakistani student-style language;

current labels are intentionally simplified;

the dataset does not establish psychological validity;

the dataset does not establish whether a recommended break causes improved performance;

language-specific benchmark results have substantial uncertainty due to small test subsets.

Research basis

H. Zhou, L. Fang, X. Song, W. Yin, J. Kang, Y. Huang, and J. Huang,
"Do micro-breaks between study sessions enhance Chinese university students' learning concentration?"
Frontiers in Psychology, 2026.
DOI: 10.3389/fpsyg.2026.1714389

S. Vinesh, G. Rakshitha, V. Skandapriya, G. M. Bhoomika, and J. D. Hemalatha,
"Smart Break Recommendation System Based on Student Mental Fatigue and Task Type."
2026 International Conference on Smart Futuristic Technology (ICSFT), 2026.
DOI: 10.1109/ICSFT66733.2026.11507606

Version

Current working version:

0.1-candidates

The public reviewed release should receive a new version after project-team review and final split regeneration.

License

Planned public dataset license:

CC BY 4.0