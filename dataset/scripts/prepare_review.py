import csv
import json
import re
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]

INPUT = ROOT / "data" / "generated_candidates.jsonl"
OUTPUT = ROOT / "data" / "review_queue.csv"


def normalize(text: str) -> str:
    text = text.lower().strip()

    text = re.sub(
        r"[^\w\s]",
        "",
        text,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text


rows = []

with INPUT.open(
    "r",
    encoding="utf-8",
) as file:

    for line in file:

        if not line.strip():
            continue

        rows.append(
            json.loads(line)
        )


print(f"Loaded {len(rows)} candidates")


normalized_counts = Counter(
    normalize(row["text"])
    for row in rows
)


style_counts = Counter(
    row["language_style"]
    for row in rows
)


state_counts = Counter(
    row["primary_state"]
    for row in rows
)


output_rows = []


for row in rows:

    flags = []

    text = row["text"].strip()

    normalized = normalize(text)

    if normalized_counts[normalized] > 1:
        flags.append(
            "possible_duplicate"
        )

    if len(text) < 5:
        flags.append(
            "too_short"
        )

    if len(text) > 180:
        flags.append(
            "too_long"
        )

    clinical_terms = [
        "depression",
        "depressed",
        "adhd",
        "anxiety disorder",
        "mental illness",
        "bipolar",
        "ocd",
        "suicidal",
    ]

    if any(
        term in text.lower()
        for term in clinical_terms
    ):
        flags.append(
            "clinical_language"
        )

    bad_styles = {
        "english",
        "roman_urdu",
        "code_mixed",
    }

    if (
        row["language_style"]
        not in bad_styles
    ):
        flags.append(
            "invalid_language_style"
        )

    output_rows.append({
        "seed_id":
            row["seed_id"],

        "variant_id":
            row["variant_id"],

        "text":
            row["text"],

        "language_style":
            row["language_style"],

        "energy":
            row["energy"],

        "tension":
            row["tension"],

        "attention":
            row["attention"],

        "primary_state":
            row["primary_state"],

        "auto_flags":
            "; ".join(flags),

        # Fill these manually
        "decision":
            "",

        "review_note":
            "",
    })


with OUTPUT.open(
    "w",
    encoding="utf-8-sig",
    newline="",
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=output_rows[0].keys(),
    )

    writer.writeheader()

    writer.writerows(
        output_rows
    )


print()
print("Language distribution:")

for key, value in style_counts.items():
    print(
        f"  {key}: {value}"
    )


print()
print("State distribution:")

for key, value in state_counts.items():
    print(
        f"  {key}: {value}"
    )


flagged = sum(
    1
    for row in output_rows
    if row["auto_flags"]
)


print()
print(
    f"Automatically flagged rows: {flagged}"
)

print(
    f"Review file created: {OUTPUT}"
)