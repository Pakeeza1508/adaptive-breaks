import csv
import json
import os
import time
from pathlib import Path

from groq import Groq


ROOT = Path(__file__).resolve().parents[1]

INPUT = ROOT / "data" / "review_queue.csv"

CHECKPOINT = (
    ROOT
    / "data"
    / "auto_review_checkpoint.jsonl"
)

REVIEWED_CSV = (
    ROOT
    / "data"
    / "review_queue_reviewed.csv"
)

CLEAN_JSONL = (
    ROOT
    / "data"
    / "clean_generated.jsonl"
)

FAILURES = (
    ROOT
    / "data"
    / "auto_review_failures.jsonl"
)

MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)

client = Groq(
    api_key=os.environ["GROQ_API_KEY"]
)


SYSTEM = """
You are reviewing ONE example for a small,
non-clinical student cognitive-state dataset.

The row already has these labels:

- energy
- tension
- attention
- primary_state

Decide only:

KEEP
- natural student language
- meaning fits labels
- concise and plausible

EDIT
- meaning is correct
- wording is unnatural, awkward, overly formal,
  poor Roman Urdu, or unnatural code mixing
- provide corrected wording without changing labels

DROP
- meaning does not fit labels
- introduces clinical diagnosis
- introduces self-harm
- changes severity significantly
- nonsensical or unusable

Roman Urdu should sound natural for a Pakistani
university student.

Code-mixed language should sound naturally mixed,
not mechanically translated.

Never change the labels.
"""


RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "dataset_review",
        "strict": True,
        "schema": {
            "type": "object",

            "properties": {
                "decision": {
                    "type": "string",
                    "enum": [
                        "keep",
                        "edit",
                        "drop"
                    ]
                },

                "review_note": {
                    "type": "string"
                },

                "edited_text": {
                    "type": "string"
                }
            },

            "required": [
                "decision",
                "review_note",
                "edited_text"
            ],

            "additionalProperties": False
        }
    }
}


def load_rows():
    with INPUT.open(
        "r",
        encoding="utf-8-sig"
    ) as file:

        return list(
            csv.DictReader(file)
        )


def load_checkpoint():
    completed = {}

    if not CHECKPOINT.exists():
        return completed

    with CHECKPOINT.open(
        "r",
        encoding="utf-8"
    ) as file:

        for line in file:

            if not line.strip():
                continue

            try:
                row = json.loads(line)

                completed[
                    row["variant_id"]
                ] = row

            except Exception:
                pass

    return completed


def save_checkpoint(review):
    with CHECKPOINT.open(
        "a",
        encoding="utf-8"
    ) as file:

        file.write(
            json.dumps(
                review,
                ensure_ascii=False
            )
            + "\n"
        )


def save_failure(
    row,
    error
):
    with FAILURES.open(
        "a",
        encoding="utf-8"
    ) as file:

        file.write(
            json.dumps(
                {
                    "variant_id":
                        row["variant_id"],

                    "text":
                        row["text"],

                    "error":
                        str(error),
                },
                ensure_ascii=False
            )
            + "\n"
        )


def review_one(row):
    payload = {
        "variant_id":
            row["variant_id"],

        "text":
            row["text"],

        "language_style":
            row["language_style"],

        "labels": {
            "energy":
                row["energy"],

            "tension":
                row["tension"],

            "attention":
                row["attention"],

            "primary_state":
                row["primary_state"],
        }
    }

    max_attempts = 6

    for attempt in range(
        1,
        max_attempts + 1
    ):

        try:

            response = (
                client.chat.completions.create(
                    model=MODEL,

                    temperature=0,

                    messages=[
                        {
                            "role": "system",
                            "content": SYSTEM,
                        },

                        {
                            "role": "user",
                            "content":
                                json.dumps(
                                    payload,
                                    ensure_ascii=False
                                ),
                        }
                    ],

                    response_format=
                        RESPONSE_FORMAT,
                )
            )

            content = (
                response
                .choices[0]
                .message
                .content
            )

            result = json.loads(
                content
            )

            return {
                "variant_id":
                    row["variant_id"],

                "decision":
                    result["decision"],

                "review_note":
                    result["review_note"],

                "edited_text":
                    result[
                        "edited_text"
                    ],
            }

        except Exception as exc:

            message = str(exc)

            # Rate limit
            if (
                "429" in message
                or
                "rate_limit" in message.lower()
            ):

                wait = min(
                    3 * attempt,
                    15
                )

                print(
                    f"  rate limit — "
                    f"waiting {wait}s"
                )

                time.sleep(wait)

                continue

            # Groq occasionally fails
            # strict JSON generation.
            if (
                "json_validate_failed"
                in message
                or
                "Failed to validate JSON"
                in message
            ):

                wait = attempt

                print(
                    f"  JSON validation retry "
                    f"{attempt}/{max_attempts}"
                )

                time.sleep(wait)

                continue

            raise

    raise RuntimeError(
        "Review failed after retries"
    )


def build_final_files(
    original_rows,
    reviews
):

    final_rows = []
    clean_rows = []

    for row in original_rows:

        variant_id = row[
            "variant_id"
        ]

        review = reviews.get(
            variant_id
        )

        if review is None:
            continue

        decision = review[
            "decision"
        ]

        edited_text = (
            review.get(
                "edited_text",
                ""
            )
            or ""
        ).strip()

        final_text = row[
            "text"
        ].strip()

        if (
            decision == "edit"
            and edited_text
        ):
            final_text = edited_text

        output = dict(row)

        output[
            "decision"
        ] = decision

        output[
            "review_note"
        ] = review[
            "review_note"
        ]

        output[
            "edited_text"
        ] = (
            edited_text
            if decision == "edit"
            else ""
        )

        final_rows.append(
            output
        )

        if decision != "drop":

            clean_rows.append({
                "seed_id":
                    row["seed_id"],

                "variant_id":
                    variant_id,

                "text":
                    final_text,

                "language_style":
                    row[
                        "language_style"
                    ],

                "energy":
                    row["energy"],

                "tension":
                    row["tension"],

                "attention":
                    row["attention"],

                "primary_state":
                    row[
                        "primary_state"
                    ],

                "source":
                    "groq_generated_auto_reviewed",

                "review_decision":
                    decision,
            })

    if final_rows:

        fieldnames = list(
            final_rows[0].keys()
        )

        with REVIEWED_CSV.open(
            "w",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            writer = csv.DictWriter(
                file,
                fieldnames=fieldnames,
            )

            writer.writeheader()

            writer.writerows(
                final_rows
            )

    with CLEAN_JSONL.open(
        "w",
        encoding="utf-8"
    ) as file:

        for row in clean_rows:

            file.write(
                json.dumps(
                    row,
                    ensure_ascii=False
                )
                + "\n"
            )

    counts = {
        "keep": 0,
        "edit": 0,
        "drop": 0,
    }

    for review in reviews.values():

        decision = review[
            "decision"
        ]

        if decision in counts:
            counts[
                decision
            ] += 1

    return (
        counts,
        len(clean_rows)
    )


rows = load_rows()

reviews = load_checkpoint()

print(
    f"Loaded {len(rows)} rows"
)

print(
    f"Already reviewed: "
    f"{len(reviews)}"
)

print()


for index, row in enumerate(
    rows,
    start=1
):

    variant_id = row[
        "variant_id"
    ]

    if variant_id in reviews:

        print(
            f"SKIP {index}/"
            f"{len(rows)} "
            f"{variant_id}"
        )

        continue

    try:

        review = review_one(
            row
        )

        save_checkpoint(
            review
        )

        reviews[
            variant_id
        ] = review

        print(
            f"OK   {index}/"
            f"{len(rows)} "
            f"{variant_id} "
            f"-> "
            f"{review['decision']}"
        )

        # Gentle pacing for free tier
        time.sleep(0.35)

    except Exception as exc:

        print(
            f"FAILED "
            f"{variant_id}: "
            f"{exc}"
        )

        save_failure(
            row,
            exc
        )


print()
print(
    "Building final files..."
)

counts, clean_count = (
    build_final_files(
        rows,
        reviews
    )
)

print()
print(
    "Review status"
)

print(
    f"Completed: "
    f"{len(reviews)}/"
    f"{len(rows)}"
)

print(
    f"KEEP: {counts['keep']}"
)

print(
    f"EDIT: {counts['edit']}"
)

print(
    f"DROP: {counts['drop']}"
)

print(
    f"Clean rows: "
    f"{clean_count}"
)

print()
print(
    f"Checkpoint: "
    f"{CHECKPOINT}"
)

print(
    f"Reviewed CSV: "
    f"{REVIEWED_CSV}"
)

print(
    f"Clean JSONL: "
    f"{CLEAN_JSONL}"
)