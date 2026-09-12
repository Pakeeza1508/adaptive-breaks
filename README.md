# Kya Scene Hai?

Your brain changes. Your break should too.

Kya Scene Hai? is a non-clinical adaptive micro-break system for students and knowledge workers. It estimates a user's momentary study/work state, selects a short intervention that better fits that state, asks whether the break helped, and uses that outcome to improve later recommendations.

The project is designed around one practical question:

What kind of break does this person need right now?

Instead of giving every user the same timer, breathing exercise, or generic reminder, the system tries to distinguish whether the user is currently drained, overwhelmed, distracted, or stuck, and then chooses an appropriate 20-second to 3-minute intervention.

## Core idea

A user writes a short natural-language statement such as:

I'm cooked

kal exam hai aur focus nai ho raha

same bug 40 mins se dekh raha hun

dimagh band hogaya

I keep switching tabs and can't read one paragraph

The system converts the text into a small structured state:

```json
{
  "energy": "low",
  "tension": "medium",
  "attention": "stuck",
  "primary_state": "stuck",
  "confidence": 0.87,
  "safety": "normal"
}
```

The language model only performs state extraction.

The final break selection is made by our own Scene Engine, not by an unrestricted chatbot response.

## State model

The MVP intentionally avoids broad emotion recognition and clinical labels.

### Energy

- low
- normal
- high

### Tension

- low
- medium
- high

### Attention

- okay
- scattered
- stuck

### User-facing primary states

DRAINED

Low energy or mental fatigue is the dominant signal.

OVERWHELMED

High tension, workload pressure, panic, or overload is dominant.

DISTRACTED

Attention repeatedly shifts and the user cannot stay on one target.

STUCK

Attention is locked on the same problem or cognitive loop with little progress.

## Intervention modes

The Scene Engine maps the estimated state to one of four micro-break families.

### ACTIVATE

Used mainly when energy is low.

Purpose:

gently increase stimulation.

**Examples:**

- short playful drawing

- tiny physical reset

- absurd rapid creative task

### DOWNSHIFT

Used mainly when tension is high.

Purpose:

lower stimulation and reduce overload.

**Examples:**

- slow-line drawing

- simple visual rhythm

- low-stimulation ambient break

### REFOCUS

Used mainly when attention is scattered.

Purpose:

give attention one small constrained target.

**Examples:**

- three-line drawing

- one-dot challenge

- short constrained visual task

### DETACH

Used mainly when the user is stuck in the same loop.

Purpose:

switch cognitive context completely for a short period.

**Examples:**

- absurd object drawing

- unrelated creative prompt

- playful visual interruption

## Adaptive loop

```text
User statement
      |
      v
State Estimator
      |
      |-- Energy
      |-- Tension
      |-- Attention
      |-- Primary state
      v
Scene Engine
      |
      |-- ACTIVATE
      |-- DOWNSHIFT
      |-- REFOCUS
      |-- DETACH
      v
20 sec / 1 min / 3 min intervention
      |
      v
Better / Same / Worse
      |
      v
Personalization update
```

The user gives one-tap outcome feedback after a break:

- Better

- Same

- Worse

The system stores this observed outcome and adjusts later intervention scores for similar states.

### Example

**Context:**
low energy + stuck attention

**Past outcomes:**
DETACH   -> Better 4/5 times
ACTIVATE -> Better 1/3 times

**Next recommendation:**
DETACH receives a higher personalized score

The current MVP begins with expert/rule priors plus lightweight reward-based personalization.

A contextual-bandit / Thompson-sampling policy is a planned extension after enough real feedback exists.

## Why this problem?

Students often respond to cognitive fatigue by opening social media or switching to another feed. That produces a break, but not necessarily a useful recovery intervention.

Recent work suggests that micro-breaks can support concentration, but also identifies important open questions around the type of break, personalization, and real-time adaptation.

A 2026 Frontiers in Psychology study on micro-breaks between study sessions reported a positive relationship between micro-breaks and learning concentration in university students. The authors also identified future directions including:

- comparing different types of micro-breaks;

- studying cross-cultural differences;

- developing AI-driven personalized micro-break systems based on real-time student states.

### Reference

H. Zhou, L. Fang, X. Song, W. Yin, J. Kang, Y. Huang, and J. Huang,
"Do micro-breaks between study sessions enhance Chinese university students' learning concentration?"
Frontiers in Psychology, vol. 17, 2026.
DOI: 10.3389/fpsyg.2026.1714389

### Reference

A second 2026 paper, "Smart Break Recommendation System Based on Student Mental Fatigue and Task Type," explores personalized break recommendation using task/fatigue detection and reinforcement-learning-based customization from passive behavioral signals such as keyboard and mouse activity.

Reference:

S. Vinesh, G. Rakshitha, V. Skandapriya, G. M. Bhoomika, and J. D. Hemalatha,
"Smart Break Recommendation System Based on Student Mental Fatigue and Task Type,"
2026 International Conference on Smart Futuristic Technology (ICSFT), 2026.
DOI: 10.1109/ICSFT66733.2026.11507606

## Our research gap

Kya Scene Hai? does not claim that adaptive breaks have never been studied.

The project focuses on a narrower gap:

Can a low-friction, text-first adaptive system use English, Roman Urdu, and Urdu-English code-mixed language to estimate a small non-clinical momentary cognitive state and choose a more suitable micro-break based on both the current state and previous outcomes?

The MVP deliberately avoids:

- EEG
- wearables
- webcam emotion recognition
- continuous passive surveillance
- clinical diagnosis

The interaction begins with a simple user-written statement.

## Dataset

The project includes:

- Kya Scene Hai — Code-Mixed Cognitive State Dataset

The working dataset contains:

- English
- Roman Urdu
- Urdu-English code-mixed student language

Labels:

- energy
- tension
- attention
- primary_state
- language_style

Dataset construction:

```text
80 manually curated human seed examples
             |
             v
3 controlled paraphrases per seed
             |
             v
240 generated candidates
             |
             v
automatic structured QA
             |
             v
project-team manual review
             |
             v
clean release dataset
```

The original human seeds are balanced across:

- 20 Drained
- 20 Overwhelmed
- 20 Distracted
- 20 Stuck

Generated variants retain the original seed_id.

This allows leakage-safe train/validation/test splitting by seed group.

### See:

- `dataset/README.md`
- `dataset/LABEL_GUIDE.md`
- `dataset/WORKFLOW.md`

for dataset-specific documentation.

## Initial ML benchmark

We evaluated three state-estimation approaches.

### Split design

After exact normalized duplicate removal:

- total rows: 314
- unique seed groups: 80
- train rows: 220
- validation rows: 47
- test rows: 47

Splits are grouped by seed_id.

Paraphrases of the same original statement never cross train/validation/test boundaries.

### Primary-state classification

| Model | Accuracy | Macro-F1 |
| --- | ---: | ---: |
| TF-IDF + Logistic Regression | 0.8511 | 0.8464 |
| Rule-based baseline | 0.6596 | 0.6263 |
| multilingual-E5 + Logistic Regression | 0.5957 | 0.5774 |

The lightweight TF-IDF classifier currently performs best on this dataset.

### All structured targets

| Model | Target | Accuracy | Macro-F1 |
| --- | --- | ---: | ---: |
| Rules | Energy | 0.7660 | 0.5008 |
| Rules | Tension | 0.5957 | 0.5067 |
| Rules | Attention | 0.4894 | 0.4975 |
| Rules | Primary state | 0.6596 | 0.6263 |
| TF-IDF + LR | Energy | 0.8936 | 0.6134 |
| TF-IDF + LR | Tension | 0.7021 | 0.7007 |
| TF-IDF + LR | Attention | 0.8511 | 0.8377 |
| TF-IDF + LR | Primary state | 0.8511 | 0.8464 |
| multilingual-E5 + LR | Energy | 0.5745 | 0.5229 |
| multilingual-E5 + LR | Tension | 0.6383 | 0.6400 |
| multilingual-E5 + LR | Attention | 0.7021 | 0.7049 |
| multilingual-E5 + LR | Primary state | 0.5957 | 0.5774 |

Macro-F1 is treated as the main metric because some component labels are not perfectly balanced.

### Primary-state performance by language style

| Model | Language style | Accuracy | Macro-F1 |
| --- | --- | ---: | ---: |
| TF-IDF + Logistic Regression | Code-mixed | 0.9375 | 0.9365 |
| TF-IDF + Logistic Regression | Roman Urdu | 0.8667 | 0.8532 |
| TF-IDF + Logistic Regression | English | 0.7500 | 0.7183 |
| multilingual-E5 + Logistic Regression | English | 0.8125 | 0.8032 |
| multilingual-E5 + Logistic Regression | Code-mixed | 0.5000 | 0.4675 |
| multilingual-E5 + Logistic Regression | Roman Urdu | 0.4667 | 0.3745 |
| Rule baseline | Code-mixed | 0.7500 | 0.7143 |
| Rule baseline | Roman Urdu | 0.6667 | 0.6181 |
| Rule baseline | English | 0.5625 | 0.5137 |

An interesting early finding is that word/character n-gram features perform particularly well on the current Roman Urdu and code-mixed subsets.

These are MVP results on a small dataset and should not be interpreted as evidence of clinical validity or broad population generalization.

The generated examples are undergoing a final project-team review. The benchmark will be rerun if that review materially changes the released dataset.

## Kaggle experiment

Training and evaluation were run through a reproducible Kaggle pipeline.

The completed Kaggle environment exposed:

- 2 × Tesla T4

The benchmark pipeline automatically produced:

- exact dataset splits
- trained Logistic Regression models
- E5 embeddings
- confusion matrices
- per-target metrics
- language-wise metrics
- misclassified examples
- experiment summary
- local copies of all Kaggle artifacts

The current experiment is intentionally lightweight.

We are not fine-tuning a large language model for the MVP.

## AI architecture

The deployed application uses a model-agnostic server-side state extraction layer.

Current production candidate:

Gemini 3.5 Flash-Lite is currently used through a Supabase Edge Function for structured state extraction.

### Architecture

```text
React / Vite
      ↓
Supabase Edge Function
      ↓
Gemini 3.5 Flash-Lite
      ↓
Structured state
      ↓
Scene Engine
      ↓
Personalized mode selection
      ↓
Micro-break
      ↓
Better / Same / Worse
      ↓
Supabase Postgres
      ↓
Future personalization
```

The Gemini API key stays server-side and is never exposed through a VITE_* environment variable.

### Free-tier deployment architecture

The MVP is designed to avoid paid infrastructure.

```text
GitHub
   |
   v
Vercel Hobby
React / Vite frontend
   |
   v
Supabase Free
Edge Functions + database + anonymous user history
   |
   v
Gemini API
structured state extraction
```

### Research assets

- Hugging Face -> public dataset
- Kaggle       -> training/evaluation experiments

No paid always-on GPU server is required.

## Tech stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router

### Backend

- Supabase
- Supabase Edge Functions
- Supabase Postgres
- anonymous/pseudonymous user history

### AI

- Gemini 3.5 Flash-Lite for structured production state extraction
- Groq used during dataset generation/review experiments
- deterministic Scene Engine for final intervention selection

### ML / research

- Python
- pandas
- scikit-learn
- sentence-transformers
- multilingual-E5-small
- TF-IDF word + character n-grams
- Logistic Regression
- Kaggle

### Dataset hosting

- Hugging Face Datasets

## Repository structure

### Target structure

```text
adaptive-breaks/
├── src/
│   ├── engine/
│   │   ├── sceneEngine.ts
│   │   └── personalization.ts
│   ├── services/
│   │   └── sceneApi.ts
│   ├── routes.tsx
│   └── index.css
│
├── supabase/
│   └── functions/
│       └── analyze-scene/
│           └── index.ts
│
├── dataset/
│   ├── README.md
│   ├── LABEL_GUIDE.md
│   ├── WORKFLOW.md
│   ├── data/
│   └── scripts/
│
├── kaggle/
│   └── train_and_compare.py
│
├── scripts/
│   ├── publish_dataset_to_kaggle.ps1
│   └── run_kaggle_and_download.ps1
│
└── README.md
```

## Current status

### Completed

- React/Vite micro-break application
- creative/timed intervention library
- deterministic Scene Engine
- ACTIVATE / DOWNSHIFT / REFOCUS / DETACH mode mapping
- real Gemini 3.5 Flash-Lite structured state extraction
- Supabase Edge Function for server-side Gemini access
- Gemini API key kept server-side
- English, Roman Urdu, and code-mixed input support
- high-risk language safety diversion
- user correction controls on detected state
- Better / Same / Worse feedback flow
- local personalization fallback
- Supabase Postgres feedback persistence
- pseudonymous browser-level user IDs
- previous outcome history loaded for future recommendations
- mode-level reward-based personalization
- 80 manually curated seed examples
- 240 generated paraphrase candidates
- automated structured dataset review
- leakage-safe seed-group splitting
- reproducible Kaggle experiment pipeline
- Rules baseline
- TF-IDF + Logistic Regression benchmark
- multilingual-E5 + Logistic Regression benchmark
- TF-IDF primary-state Macro-F1: 0.8464
- production build verified successfully

### In progress

- final project-team dataset review
- UI/demo polish
- clearer adaptation visualization for the final demo
- review of confidence/correction UX

### Next

- improve demo visibility of personalization
- optionally persist user state corrections
- optionally extend personalization from mode-level to individual break/activity preference
- deploy the frontend to Vercel
- publish the final reviewed dataset to Hugging Face
- prepare final presentation and demo video

## Safety and scope

Kya Scene Hai? is a non-clinical study/work micro-break system.

It does not:

- diagnose mental illness;
- replace therapy;
- provide psychiatric treatment;
- infer clinical conditions from ordinary study stress;
- claim validated psychological profiling;
- route high-risk distress into playful micro-break recommendations.

High-risk language is handled outside the four normal intervention modes and routed toward appropriate human/professional support.

## Research questions

### Primary

Can a lightweight adaptive system use a user's current momentary state and previous break outcomes to choose a more suitable micro-break than a one-size-fits-all recommendation?

### State estimation

Can English, Roman Urdu, and Urdu-English code-mixed student language be reliably mapped to a small non-clinical cognitive-state representation?

### Personalization

Can explicit Better / Same / Worse feedback provide enough signal for a lightweight personalization policy to improve intervention selection over repeated use?

## Limitations

The current project has several important limitations:

- the dataset is small;
- generated paraphrases are part of the working dataset;
- the current evaluation set is small;
- language-style results therefore have wide uncertainty;
- real-world intervention effectiveness has not yet been established;
- the feedback policy has not yet been evaluated longitudinally;
- the project is not clinically validated;
- the initial user population is primarily students/knowledge workers.

## Reproducibility

The repository includes:

- `dataset/`
- `kaggle/train_and_compare.py`
- `scripts/publish_dataset_to_kaggle.ps1`
- `scripts/run_kaggle_and_download.ps1`

The Kaggle experiment produces:

- `metrics_summary.csv`
- `primary_state_ranking.csv`
- `language_breakdown.csv`
- `experiment_summary.md`
- confusion matrices
- misclassified examples
- trained `.joblib` classifiers
- train / validation / test splits

No benchmark result should be changed in this README unless it comes from an actual recorded experiment.

## License

Application code licensing can be defined separately from the dataset license.

The dataset card currently uses CC BY 4.0 for the planned public dataset release.