import csv
import json
import os
import time
from pathlib import Path

from google import genai


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
    / "gemini_review_failures.jsonl"
)

MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.5-flash-lite",
)

BATCH_SIZE = 10


client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"]
)


SYSTEM = """
You are reviewing examples for a small,
non-clinical student cognitive-state dataset.

Each row already has labels:

energy
tension
attention
primary_state

For every example choose exactly one decision:

keep
- natural student language
- meaning matches the labels
- concise and plausible

edit
- label meaning is correct
- wording is awkward, overly formal,
  unnatural Roman Urdu, or unnatural code mixing
- provide corrected wording

drop
- meaning does not fit labels
- introduces psychiatric diagnosis
- introduces self-harm
- changes severity substantially
- nonsensical or unusable

Important:

Roman Urdu should sound natural for Pakistani
university students.

Code-mixed language should sound naturally mixed.

Never alter the provided labels.
"""


RESPONSE_SCHEMA = {
    "type": "object",

    "properties": {
        "reviews": {
            "type": "array",

            "items": {
                "type": "object",

                "properties": {
                    "variant_id": {
                        "type": "string"
                    },

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
                    "variant_id",
                    "decision",
                    "review_note",
                    "edited_text"
                ],

                "additionalProperties": False
            }
        }
    },

    "required": [
        "reviews"
    ],

    "additionalProperties": False
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
    rows,
    error
):

    with FAILURES.open(
        "a",
        encoding="utf-8"
    ) as file:

        file.write(
            json.dumps(
                {
                    "variant_ids": [
                        r["variant_id"]
                        for r in rows
                    ],

                    "error": str(error)
                },

                ensure_ascii=False
            )
            + "\n"
        )


def review_batch(batch):

    payload = []

    for row in batch:

        payload.append({
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
        })

    prompt = (
        SYSTEM
        + "\n\nReview these examples:\n"
        + json.dumps(
            payload,
            ensure_ascii=False
        )
    )

    max_attempts = 6

    for attempt in range(
        1,
        max_attempts + 1
    ):

        try:

            interaction = (
                client.interactions.create(
                    model=MODEL,

                    input=prompt,

                    response_format={
                        "type": "text",

                        "mime_type":
                            "application/json",

                        "schema":
                            RESPONSE_SCHEMA,
                    },
                )
            )

            result = json.loads(
                interaction.output_text
            )

            reviews = result[
                "reviews"
            ]

            expected = {
                row["variant_id"]
                for row in batch
            }

            received = {
                row["variant_id"]
                for row in reviews
            }

            if expected != received:

                raise ValueError(
                    "Gemini returned wrong "
                    "variant IDs"
                )

            return reviews

        except Exception as exc:

            message = str(exc).lower()

            if (
                "429" in message
                or
                "resource_exhausted"
                in message
                or
                "503" in message
                or
                "unavailable"
                in message
            ):

                wait = min(
                    2 ** attempt,
                    20
                )

                print(
                    f"  retry "
                    f"{attempt}/"
                    f"{max_attempts}"
                    f" — waiting {wait}s"
                )

                time.sleep(wait)

                continue

            if attempt < 3:

                print(
                    f"  response retry "
                    f"{attempt}/3"
                )

                time.sleep(1)

                continue

            raise

    raise RuntimeError(
        "Gemini batch failed "
        "after retries"
    )


def build_final_files(
    original_rows,
    reviews
):

    final_rows = []
    clean_rows = []

    for row in original_rows:

        review = reviews.get(
            row["variant_id"]
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

        final_text = (
            row["text"].strip()
        )

        if (
            decision == "edit"
            and edited_text
        ):
            final_text = (
                edited_text
            )

        output = dict(row)

        output["decision"] = (
            decision
        )

        output["review_note"] = (
            review["review_note"]
        )

        output["edited_text"] = (
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
                    row["variant_id"],

                "text":
                    final_text,

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

                "source":
                    "generated_reviewed",

                "review_decision":
                    decision,
            })

    if final_rows:

        with REVIEWED_CSV.open(
            "w",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            writer = csv.DictWriter(
                file,
                fieldnames=
                    final_rows[0].keys(),
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

    return clean_rows


rows = load_rows()

reviews = load_checkpoint()

pending = [
    row
    for row in rows
    if row["variant_id"]
    not in reviews
]


print(
    f"Total rows: {len(rows)}"
)

print(
    f"Already reviewed: "
    f"{len(reviews)}"
)

print(
    f"Remaining: "
    f"{len(pending)}"
)

print(
    f"Gemini model: {MODEL}"
)

print()


for start in range(
    0,
    len(pending),
    BATCH_SIZE
):

    batch = pending[
        start:
        start + BATCH_SIZE
    ]

    try:

        batch_reviews = (
            review_batch(batch)
        )

        for review in batch_reviews:

            reviews[
                review["variant_id"]
            ] = review

            save_checkpoint(
                review
            )

        print(
            f"OK batch: "
            f"{len(reviews)}/"
            f"{len(rows)} reviewed"
        )

        time.sleep(0.3)

    except Exception as exc:

        print(
            f"BATCH FAILED: {exc}"
        )

        print(
            "Trying rows individually..."
        )

        save_failure(
            batch,
            exc
        )

        for row in batch:

            if (
                row["variant_id"]
                in reviews
            ):
                continue

            try:

                result = (
                    review_batch(
                        [row]
                    )[0]
                )

                reviews[
                    result["variant_id"]
                ] = result

                save_checkpoint(
                    result
                )

                print(
                    "  OK "
                    + row["variant_id"]
                )

            except Exception as row_exc:

                print(
                    "  FAILED "
                    + row["variant_id"]
                    + ": "
                    + str(row_exc)
                )

                save_failure(
                    [row],
                    row_exc
                )


clean_rows = build_final_files(
    rows,
    reviews
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


print()
print("REVIEW COMPLETE")
print(
    f"Completed: "
    f"{len(reviews)}/"
    f"{len(rows)}"
)

print(
    f"KEEP: "
    f"{counts['keep']}"
)

print(
    f"EDIT: "
    f"{counts['edit']}"
)

print(
    f"DROP: "
    f"{counts['drop']}"
)

print(
    f"Clean generated rows: "
    f"{len(clean_rows)}"
)