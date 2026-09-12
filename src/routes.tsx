import {
  createBrowserRouter,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  chooseBreakMode,
  modeLabels,
  overrideScene,
  sceneLabels,
  sceneMessages,
  type BreakMode,
  type PrimaryState,
  type SceneState,
} from "./engine/sceneEngine";
import { analyzeScene } from "./services/sceneApi";
import {
  getRemotePersonalization,
  saveFeedback,
  saveSceneCorrection,
  type RemotePersonalization,
} from "./services/feedbackApi";

import {
  getModeBonuses,
  recordOutcome,
  type FeedbackOutcome,
} from "./engine/personalization";

type Constraint =
  | "none"
  | "five"
  | "one"
  | "three"
  | "circles"
  | "singleColor"
  | "follow";
type Challenge = {
  title: string;
  instruction: string;
  duration: number;
  constraint: Constraint;
  starter: string;
  completion: string;
  vibe: string[];
};
type Saved = {
  id: string;
  image: string;
  title: string;
  date: string;
  challenge: Challenge;
};
const make = (
  title: string,
  instruction: string,
  duration: number,
  constraint: Constraint,
  starter: string,
  vibe: string[],
  completion = "You made a thing.",
): Challenge => ({
  title,
  instruction,
  duration,
  constraint,
  starter,
  vibe,
  completion,
});
const challenges: Challenge[] = [
  make(
    "THREE-CIRCLE FACE",
    "Draw a face using exactly three circles.",
    15,
    "circles",
    "circle",
    ["wake", "reset"],
  ),
  make(
    "ONE DOT, GO",
    "Turn this dot into something. Anything.",
    15,
    "none",
    "dot",
    ["reset"],
  ),
  make(
    "RIDICULOUS HAT",
    "Give this cloud a ridiculous hat.",
    20,
    "none",
    "cloud",
    ["laugh"],
  ),
  make(
    "SMALLEST MONSTER",
    "Draw the world's smallest monster.",
    20,
    "none",
    "monster",
    ["wake"],
  ),
  make(
    "THREE LINES",
    "Add exactly three lines to this blob.",
    20,
    "three",
    "blob",
    ["reset"],
  ),
  make(
    "ANNOYED CIRCLE",
    "Make this circle look annoyed.",
    20,
    "none",
    "circle",
    ["laugh"],
  ),
  make(
    "FIVE-LINE CAT",
    "Draw a cat using only five lines.",
    30,
    "five",
    "ears",
    ["wake"],
    "Tiny masterpiece unlocked.",
  ),
  make(
    "ONE-LINE CHAOS",
    "Draw anything without lifting your finger.",
    30,
    "one",
    "dot",
    ["wake", "reset"],
    "Look at that weird little thing.",
  ),
  make(
    "UGLY FLOWER CLUB",
    "Make the ugliest flower possible. Really commit.",
    45,
    "none",
    "flower",
    ["laugh"],
    "Honestly? It exists. That's enough.",
  ),
  make(
    "SUSPICIOUS CLOUD",
    "Make this cloud look extremely suspicious.",
    45,
    "none",
    "cloud",
    ["laugh"],
    "Look at that weird little thing.",
  ),
  make(
    "BLOB BUDDY",
    "Turn this random blob into the dumbest creature you can imagine.",
    45,
    "none",
    "blob",
    ["laugh", "make"],
  ),
  make(
    "SLOW LINES",
    "Follow the floating dot with one continuous, relaxing line.",
    60,
    "follow",
    "dot",
    ["slow", "reset"],
  ),
  make(
    "CIRCLE WEATHER",
    "Create a pattern using only circles.",
    60,
    "circles",
    "circle",
    ["slow"],
  ),
  make(
    "WAVE MACHINE",
    "Draw waves without trying to make them perfect.",
    45,
    "one",
    "waves",
    ["slow"],
  ),
  make(
    "FISH SHOES",
    "Design shoes for a fish. It has places to be.",
    60,
    "none",
    "fish",
    ["make"],
    "Look at that weird little thing.",
  ),
  make("MONDAY FLAG", "Create a flag for Mondays.", 60, "none", "flag", [
    "make",
  ]),
  make(
    "EMPLOYABLE MONSTER",
    "Make this monster look employable.",
    60,
    "none",
    "monster",
    ["make"],
  ),
  make(
    "POTATO CELEBRITY",
    "Turn this potato into a celebrity.",
    60,
    "none",
    "potato",
    ["laugh"],
  ),
  make(
    "MYSTERY SQUIGGLE",
    "Complete this mysterious squiggle.",
    45,
    "none",
    "squiggle",
    ["make"],
  ),
  make(
    "TINY ROOM",
    "Add something ridiculous to this boring room.",
    60,
    "none",
    "room",
    ["make"],
  ),
  make("GEO SCENE", "Turn △ ○ □ into a tiny scene.", 60, "none", "shapes", [
    "make",
  ]),
  make(
    "TINY DRAGON",
    "Draw the world's least threatening dragon.",
    60,
    "none",
    "egg",
    ["laugh"],
  ),
  make(
    "BAD INVENTOR",
    "Design the world's least useful chair.",
    90,
    "none",
    "chair",
    ["laugh", "make"],
  ),
  make("SHAPE DAY", "Draw your day using only shapes.", 90, "none", "shapes", [
    "make",
  ]),
  make(
    "TWO-CM HOUSE",
    "Design a house for something only 2 cm tall.",
    90,
    "none",
    "house",
    ["make"],
  ),
  make(
    "SILLY SUN",
    "Give this sun an absurdly specific job.",
    45,
    "none",
    "sun",
    ["laugh"],
  ),
  make(
    "NON-DOMINANT HERO",
    "Draw an animal with your non-dominant hand.",
    60,
    "none",
    "paw",
    ["wake"],
  ),
];

const challengeModes: Record<
  string,
  BreakMode[]
> = {
  "THREE-CIRCLE FACE": ["refocus"],
  "ONE DOT, GO": ["refocus", "activate"],
  "RIDICULOUS HAT": ["detach"],
  "SMALLEST MONSTER": ["activate"],
  "THREE LINES": ["refocus"],
  "ANNOYED CIRCLE": ["detach"],

  "FIVE-LINE CAT": [
    "refocus",
    "activate",
  ],

  "ONE-LINE CHAOS": ["refocus"],

  "UGLY FLOWER CLUB": ["detach"],
  "SUSPICIOUS CLOUD": ["detach"],

  "BLOB BUDDY": [
    "detach",
    "activate",
  ],

  "SLOW LINES": ["downshift"],

  "CIRCLE WEATHER": [
    "downshift",
    "refocus",
  ],

  "WAVE MACHINE": ["downshift"],

  "FISH SHOES": ["detach"],
  "MONDAY FLAG": ["detach"],
  "EMPLOYABLE MONSTER": ["detach"],
  "POTATO CELEBRITY": ["detach"],

  "MYSTERY SQUIGGLE": [
    "detach",
    "refocus",
  ],

  "TINY ROOM": ["detach"],
  "GEO SCENE": ["detach"],
  "TINY DRAGON": ["detach"],
  "BAD INVENTOR": ["detach"],
  "SHAPE DAY": ["detach"],
  "TWO-CM HOUSE": ["detach"],
  "SILLY SUN": ["detach"],

  "NON-DOMINANT HERO": ["activate"],
};

function pickAdaptiveChallenge(
  mode: BreakMode,
  availableTime: number,
  challengeBonuses: Record<string, number> = {},
) {
  let pool = challenges.filter(
    (challenge) =>
      challenge.duration <= availableTime &&
      challengeModes[challenge.title]?.includes(
        mode,
      ),
  );

  // Temporary MVP fallback.
  // Later every mode will have dedicated
  // 20 sec / 1 min / 3 min activities.
  if (!pool.length) {
    pool = challenges.filter(
      (challenge) =>
        challenge.duration <= availableTime,
    );
  }

  if (!pool.length) {
    pool = challenges;
  }

  const fresh = pool.filter(
    (challenge) =>
      !recent.includes(challenge.title),
  );

  const finalPool =
    fresh.length > 0 ? fresh : pool;

  const hasChallengeHistory =
    Object.keys(challengeBonuses).length > 0;

  let selected: Challenge;

  if (hasChallengeHistory) {
    const ranked = finalPool.map(
      (challenge) => ({
        challenge,
        score:
          challengeBonuses[challenge.title] ?? 0,
      }),
    );

    const bestScore = Math.max(
      ...ranked.map((item) => item.score),
    );

    const best = ranked
      .filter((item) => item.score === bestScore)
      .map((item) => item.challenge);

    selected =
      best[Math.floor(Math.random() * best.length)];
  } else {
    selected =
      finalPool[
        Math.floor(Math.random() * finalPool.length)
      ];
  }

  recent.push(selected.title);

  if (recent.length > 3) {
    recent.shift();
  }

  return selected;
}

const recent: string[] = [];
function pick(input = "", vibe = "surprise", time?: number) {
  const words = input.toLowerCase();
  const timed =
    time ||
    (/20 second|20 sec|half a minute|quick/.test(words) ? 20 : undefined);
  let pool = timed ? challenges.filter((c) => c.duration <= timed) : challenges;
  let need = vibe;
  if (
    /fried|tired|exhaust|chill|calm|don't want to think|staring at (code|work)/.test(
      words,
    )
  )
    need = "slow";
  if (/bored|stupid|silly|funny|worst meeting|annoyed/.test(words))
    need = "laugh";
  if (/chaos|restless|focus|studying/.test(words)) need = "wake";
  if (/creative|make|design/.test(words)) need = "make";
  if (need !== "surprise") {
    const matched = pool.filter((c) => c.vibe.includes(need));
    if (matched.length) pool = matched;
  }
  const fresh = pool.filter((c) => !recent.includes(c.title));
  const result =
    (fresh.length ? fresh : pool)[
      Math.floor(Math.random() * (fresh.length ? fresh.length : pool.length))
    ] || challenges[0];
  recent.push(result.title);
  if (recent.length > 3) recent.shift();
  return result;
}
function safety(text: string) {
  return /(?:kill myself|end my life|suicide|hurt myself|harm myself|want to die)/i.test(
    text,
  );
}
function Companion({
  mood = "idle",
  x = 0,
  y = 0,
}: {
  mood?: string;
  x?: number;
  y?: number;
}) {
  return (
    <div
      aria-label="A small squishy creative companion"
      className={`companion companion-${mood}`}
      style={
        { "--look-x": `${x}px`, "--look-y": `${y}px` } as React.CSSProperties
      }
    >
      <span className="shine" />
      <span className="eye left">
        <i />
      </span>
      <span className="eye right">
        <i />
      </span>
      <span className="mouth">
        {mood === "surprised" ? "o" : mood === "sleepy" ? "﹏" : "⌣"}
      </span>
      <i className="arm a">~</i>
      <i className="arm b">~</i>
      <span className="feet">⌣　⌣</span>
    </div>
  );
}
function Nav() {
  return (
    <nav>
      <Link to="/" className="brand">
        kya scene hai<span>?</span>
      </Link>
      <div>
        <Link to="/things">Tiny Things</Link>
        <Link to="/business">Business</Link>
        <Link to="/about">Why</Link>
      </div>
    </nav>
  );
}
function Doodle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`doodle ${className}`}>{children}</span>;
}

function Home() {
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [availableTime, setAvailableTime] =
    useState(60);

  const [placeholder, setPlaceholder] =
    useState("I'm cooked");

  const [mood, setMood] =
    useState("idle");

  const [look, setLook] = useState({
    x: 0,
    y: 0,
  });

  const examples = [
    "I'm cooked",
    "kal exam hai 💀",
    "focus nai ho raha",
    "dimagh band hogaya",
    "same bug 40 mins se dekh raha hun",
    "assignment nahi ho rahi",
    "my brain is fried",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholder(
        examples[
          Math.floor(
            Math.random() * examples.length,
          )
        ],
      );
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  const readScene = () => {
    if (!text.trim()) return;

    navigate("/scene", {
      state: {
        text: text.trim(),
        availableTime,
      },
    });
  };

  return (
    <main
      className="home"
      onPointerMove={(event) =>
        setLook({
          x: Math.max(
            -4,
            Math.min(
              4,
              (event.clientX -
                innerWidth * 0.73) /
                90,
            ),
          ),
          y: Math.max(
            -3,
            Math.min(
              3,
              (event.clientY -
                innerHeight * 0.38) /
                90,
            ),
          ),
        })
      }
    >
      <Nav />

      <section className="home-hero">
        <Doodle className="squiggle">
          〰
        </Doodle>

        <Doodle className="star">
          ✦
        </Doodle>

        <div className="hero-copy">
          <p className="eyebrow">
            YOUR BRAIN CHANGES. YOUR BREAK SHOULD TOO.
          </p>

          <h1>
            Dimagh ka kya
            <br />
            scene hai?
          </h1>

          <p className="hero-promise">
            A break should know why you need one.
          </p>

          <p className="intro">
            Stuck? Drained? Distracted?
            <br />
            Don't scroll through it. Tell us the scene.
          </p>

          <div
            className="brain-input"
            id="scene-input"
          >
            <input
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              onFocus={() =>
                setMood("curious")
              }
              onBlur={() =>
                setMood("idle")
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  readScene();
                }
              }}
              placeholder={placeholder}
              aria-label="Dimagh ka kya scene hai?"
            />

            <button
              onClick={readScene}
              aria-label="Read my scene"
            >
              →
            </button>
          </div>

          <div className="time">
            <span>I have...</span>

            {[20, 60, 180].map((time) => (
              <button
                key={time}
                className={
                  availableTime === time
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setAvailableTime(time)
                }
              >
                {time === 20
                  ? "20 sec"
                  : time === 60
                    ? "1 min"
                    : "3 min"}
              </button>
            ))}
          </div>

          <button
            className="primary scene-read-button"
            onClick={readScene}
            disabled={!text.trim()}
            onMouseEnter={() =>
              setMood("excited")
            }
            onMouseLeave={() =>
              setMood("idle")
            }
          >
            READ MY SCENE <b>→</b>
          </button>
        </div>

        <div className="hero-art">
          <div className="halo" />

          <Companion
            mood={mood}
            x={look.x}
            y={look.y}
          />

          <p className="bubble">
            scene kya hai?
          </p>

          <Doodle className="scribble">
            ✎
          </Doodle>

          <div className="hero-scene-stack">
            <span>"same bug 40 mins..."</span>
            <b>STUCK</b>
            <i>→ DETACH</i>
          </div>
        </div>

        <p className="no-pressure">
          No feed. No pressure. Bas ek reset.
        </p>
      </section>

      <section className="resonance-strip">
        <p>
          Been staring at the same bug?
        </p>
        <p>
          Read the same paragraph five times?
        </p>
        <p>
          Exam pressure hitting?
        </p>
        <p>
          Brain just... done?
        </p>
        <strong>
          That's the scene.
        </strong>
      </section>

      <section className="landing-section how-section">
        <p className="eyebrow">
          DIFFERENT SCENE. DIFFERENT RESET.
        </p>

        <h2>
          Before you scroll,
          <br />
          switch the scene.
        </h2>

        <div className="how-grid">
          <article>
            <span>01</span>
            <strong>
              TELL US THE SCENE
            </strong>
            <p>
              Type it naturally — English, Roman Urdu,
              or both.
            </p>
          </article>

          <article>
            <span>02</span>
            <strong>
              WE READ THE PATTERN
            </strong>
            <p>
              Energy, tension and attention become one
              simple current scene.
            </p>
          </article>

          <article>
            <span>03</span>
            <strong>
              GET A TINY RESET
            </strong>
            <p>
              A 20-second to 3-minute intervention
              matched to what you need now.
            </p>
          </article>

          <article>
            <span>04</span>
            <strong>
              IT LEARNS WHAT HELPS
            </strong>
            <p>
              Better, Same or Worse becomes signal for
              future recommendations.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-section scenes-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              NOT EVERY TIRED BRAIN NEEDS THE SAME BREAK.
            </p>
            <h2>
              Four scenes.
              <br />
              Four kinds of reset.
            </h2>
          </div>

          <p>
            Your brain isn't always tired the same way.
            We separate fatigue, overload, scattered
            attention and getting stuck in the same loop.
          </p>
        </div>

        <div className="scene-tiles">
          <article>
            <span>↓ energy</span>
            <strong>DRAINED</strong>
            <p>Need a little activation.</p>
            <b>ACTIVATE →</b>
          </article>

          <article>
            <span>↑ tension</span>
            <strong>OVERWHELMED</strong>
            <p>Need less stimulation.</p>
            <b>DOWNSHIFT →</b>
          </article>

          <article>
            <span>↗ attention</span>
            <strong>DISTRACTED</strong>
            <p>Need one small target.</p>
            <b>REFOCUS →</b>
          </article>

          <article>
            <span>↻ loop</span>
            <strong>STUCK</strong>
            <p>Need cognitive distance.</p>
            <b>DETACH →</b>
          </article>
        </div>
      </section>

      <section className="landing-section visual-scenes-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              YOUR BRAIN HAS DIFFERENT SCENES.
            </p>
            <h2>
              Same person.
              <br />
              Different scene.
            </h2>
          </div>

          <p>
            One day you're drained. Another day you're
            overloaded. Sometimes your attention is
            everywhere. Sometimes it refuses to leave one
            problem. The reset should change with it.
          </p>
        </div>

        <div className="scene-character-grid">
          <article className="scene-character-card drained-card">
            <div className="scene-character-art">
              <div className="scene-orbit orbit-a" />
              <div className="scene-orbit orbit-b" />
              <Companion mood="drained" />
            </div>
            <div className="scene-character-copy">
              <span>“dimagh bilkul band hai.”</span>
              <strong>DRAINED</strong>
              <p>Low energy. Heavy head. Need a gentle lift.</p>
            </div>
          </article>

          <article className="scene-character-card overwhelmed-card">
            <div className="scene-character-art">
              <div className="scene-orbit orbit-a" />
              <div className="scene-orbit orbit-b" />
              <Companion mood="overwhelmed" />
            </div>
            <div className="scene-character-copy">
              <span>“kal exam hai aur sab pending hai.”</span>
              <strong>OVERWHELMED</strong>
              <p>Too much at once. Need the noise turned down.</p>
            </div>
          </article>

          <article className="scene-character-card distracted-card">
            <div className="scene-character-art">
              <div className="scene-orbit orbit-a" />
              <div className="scene-orbit orbit-b" />
              <Companion mood="distracted" />
            </div>
            <div className="scene-character-copy">
              <span>“focus nai ho raha.”</span>
              <strong>DISTRACTED</strong>
              <p>Attention everywhere. Need one small target.</p>
            </div>
          </article>

          <article className="scene-character-card stuck-card">
            <div className="scene-character-art">
              <div className="scene-orbit orbit-a" />
              <div className="scene-orbit orbit-b" />
              <Companion mood="stuck" />
            </div>
            <div className="scene-character-copy">
              <span>“same bug 40 mins se...”</span>
              <strong>STUCK</strong>
              <p>Same loop. No progress. Need a clean detour.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="landing-section language-section">
        <div className="language-visual">
          <span className="phrase p1">I'm cooked</span>
          <span className="phrase p2">focus nai ho raha</span>
          <span className="phrase p3">my brain is fried</span>
          <span className="phrase p4">assignment nahi ho rahi</span>
          <span className="phrase p5">kal exam hai 💀</span>
          <span className="phrase p6">same bug again...</span>

          <div className="language-center">
            <Companion mood="curious" />
            <strong>Say it how it is.</strong>
            <p>English · Roman Urdu · code-mixed</p>
          </div>
        </div>

        <div className="language-copy">
          <p className="eyebrow">
            MESSY INPUT IS THE POINT.
          </p>
          <h2>
            You don't need
            <br />
            the perfect words.
          </h2>
          <p>
            “I'm tired” is easy. Real study and work stress
            sounds more like “dimagh band hogaya”, “same bug
            40 mins se”, or “focus nai ho raha”. Kya Scene Hai?
            is built around that language.
          </p>
          <a href="#scene-input" className="text-link-cta">
            TELL US YOUR SCENE →
          </a>
        </div>
      </section>

      <section className="landing-section adaptation-section">
        <div className="adaptation-copy">
          <p className="eyebrow">
            A BREAK SHOULD KNOW WHY YOU NEED ONE.
          </p>

          <h2>
            Not every break works
            <br />
            for everyone.
          </h2>

          <p>
            Kya Scene Hai? does not stop at one
            recommendation. It remembers whether a
            reset felt Better, Same or Worse and uses
            that history to adjust what it recommends
            next.
          </p>
        </div>

        <div className="adaptation-demo">
          <div>
            <span>STUCK</span>
            <b>MYSTERY SQUIGGLE</b>
            <strong>BETTER ✓</strong>
          </div>
          <div>
            <span>STUCK</span>
            <b>ANNOYED CIRCLE</b>
            <strong>WORSE ×</strong>
          </div>
          <p>
            ↺ Next STUCK session:
            previous outcomes influence the choice.
          </p>
        </div>
      </section>

      <section
        className="landing-section research-section"
        id="research"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              BUILT, NOT JUST PROMPTED.
            </p>
            <h2>
              Research you can
              <br />
              actually inspect.
            </h2>
          </div>

          <p>
            The project includes a code-mixed cognitive
            state dataset, reproducible Kaggle
            experiments and an open source implementation.
          </p>
        </div>

        <div className="research-grid">
          <a
            href="https://www.kaggle.com/datasets/pakeezakhalid/kya-scene-hai-reviewed-data"
            target="_blank"
            rel="noreferrer"
          >
            <span>DATASET ↗</span>
            <strong>
              314 experiment rows
            </strong>
            <p>
              80 seed groups · English · Roman Urdu ·
              code-mixed
            </p>
          </a>

          <a
            href="https://www.kaggle.com/code/pakeezakhalid/kya-scene-hai-benchmark"
            target="_blank"
            rel="noreferrer"
          >
            <span>KAGGLE NOTEBOOK ↗</span>
            <strong>
              Macro-F1 0.8464
            </strong>
            <p>
              Reproducible baseline comparison and
              evaluation artifacts.
            </p>
          </a>

          <a
            href="https://github.com/Pakeeza1508/adaptive-breaks"
            target="_blank"
            rel="noreferrer"
          >
            <span>GITHUB ↗</span>
            <strong>
              Open implementation
            </strong>
            <p>
              Scene Engine, adaptive feedback loop,
              dataset tooling and app source.
            </p>
          </a>
        </div>
      </section>

      <section className="final-cta">
        <p className="eyebrow">
          YOUR NEXT SCROLL CAN WAIT.
        </p>

        <h2>
          What's the scene?
        </h2>

        <p>
          No feed. No overthinking. Bas ek reset.
        </p>

        <a
          className="landing-cta"
          href="#scene-input"
        >
          READ MY SCENE →
        </a>
      </section>
    </main>
  );
}

type SceneRouteState = {
  text: string;
  availableTime: number;
};

type BreakSession = {
  input: string;
  availableTime: number;
  scene: SceneState;
  mode: BreakMode;
  startedAt: number;
};

function SceneResult() {
  const navigate = useNavigate();
  const location = useLocation();

  const routeState =
    location.state as SceneRouteState | null;

  const input =
    routeState?.text ?? "";

  const availableTime =
    routeState?.availableTime ?? 60;

  const [scene, setScene] =
    useState<SceneState | null>(null);

  const [sceneLoading, setSceneLoading] =
    useState(true);

  const [sceneError, setSceneError] =
    useState("");

  const [
    remotePersonalization,
    setRemotePersonalization,
  ] = useState<RemotePersonalization | null>(null);

  const [predictedScene, setPredictedScene] =
    useState<SceneState | null>(null);

  const correctionSavedRef = useRef(false);

  useEffect(() => {
    if (!input) {
      navigate("/", {
        replace: true,
      });
      return;
    }

    let cancelled = false;

    setSceneLoading(true);
    setSceneError("");

    analyzeScene(input)
      .then((result) => {
        if (!cancelled) {
          setScene(result);
          setPredictedScene(result);
          correctionSavedRef.current = false;
        }
      })
      .catch((error) => {
        console.error("Scene analysis failed:", error);

        if (!cancelled) {
          setSceneError(
            error instanceof Error
              ? error.message
              : "Could not read the scene.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSceneLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [input, navigate]);

  useEffect(() => {
    if (scene?.safety === "elevated") {
      navigate("/support", {
        replace: true,
      });
    }
  }, [scene, navigate]);

  // Keep hook order stable while the API request is loading.
  const effectiveScene =
    scene ?? overrideScene("drained");

  useEffect(() => {
    if (
      !scene ||
      scene.safety !== "normal"
    ) {
      setRemotePersonalization(null);
      return;
    }

    let cancelled = false;

    getRemotePersonalization(
      scene.primaryState,
    )
      .then((summary) => {
        if (!cancelled) {
          setRemotePersonalization(summary);
        }
      })
      .catch((error) => {
        console.warn(
          "Remote personalization unavailable; using local fallback.",
          error,
        );

        if (!cancelled) {
          setRemotePersonalization(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    scene?.primaryState,
    scene?.safety,
  ]);

  const localPersonalization =
    getModeBonuses(effectiveScene);

  const personalization =
    remotePersonalization?.modeBonuses ??
    localPersonalization;

  const challengeBonuses =
    remotePersonalization?.challengeBonuses ?? {};

  const observations =
    remotePersonalization?.observations ?? 0;

  const baseMode = chooseBreakMode(
    effectiveScene,
    {},
  );

  const mode = chooseBreakMode(
    effectiveScene,
    personalization,
  );

  const challenge = useMemo(
    () =>
      pickAdaptiveChallenge(
        mode,
        availableTime,
        challengeBonuses,
      ),
    [
      mode,
      availableTime,
      effectiveScene.primaryState,
      challengeBonuses,
    ],
  );

  const selectedModeBonus =
    personalization[mode] ?? 0;

  const selectedChallengeBonus =
    challengeBonuses[challenge.title] ?? 0;

  const startBreak = () => {
    if (!scene) return;

    const session: BreakSession = {
      input,
      availableTime,
      scene,
      mode,
      startedAt: Date.now(),
    };

    navigate(
      `/play?c=${encodeURIComponent(
        JSON.stringify(challenge),
      )}`,
      {
        state: {
          message: sceneMessages[mode],
          session,
        },
      },
    );
  };

  const correctScene = (
    state: PrimaryState,
  ) => {
    if (!scene || state === scene.primaryState) {
      return;
    }

    if (
      predictedScene &&
      !correctionSavedRef.current &&
      state !== predictedScene.primaryState
    ) {
      correctionSavedRef.current = true;

      void saveSceneCorrection({
        predictedScene,
        correctedState: state,
      }).catch((error) => {
        console.warn(
          "Could not persist scene correction.",
          error,
        );
      });
    }

    setScene(overrideScene(state));
  };

  const corrections: {
    state: PrimaryState;
    label: string;
  }[] = [
    {
      state: "drained",
      label: "Drained",
    },
    {
      state: "overwhelmed",
      label: "Overwhelmed",
    },
    {
      state: "distracted",
      label: "Distracted",
    },
    {
      state: "stuck",
      label: "Stuck",
    },
  ];

  if (sceneLoading) {
    return (
      <main className="page scene-result">
        <Nav />
        <section className="scene-result-inner">
          <p className="eyebrow">
            SCENE ENGINE // READING
          </p>
          <h1>
            Scene samajh
            <br />
            rahe hain...
          </h1>
          <p className="scene-original-input">
            “{input}”
          </p>
        </section>
      </main>
    );
  }

  if (sceneError || !scene) {
    return (
      <main className="page scene-result">
        <Nav />
        <section className="scene-result-inner">
          <p className="eyebrow">
            SCENE ENGINE // CONNECTION ISSUE
          </p>
          <h1>Scene read nahi hua.</h1>
          <p>
            {sceneError || "Please try again."}
          </p>
          <button
            className="primary"
            onClick={() => navigate("/")}
          >
            TRY AGAIN →
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page scene-result">
      <Nav />

      <button
        className="back"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <section className="scene-result-inner">
        <p className="eyebrow">
          SCENE ENGINE // ANALYSIS COMPLETE
        </p>

        <h1>
          Scene samajh
          <br />
          aa gaya.
        </h1>

        <p className="scene-original-input">
          “{input}”
        </p>

        <div className="scene-state-card">
          <span>CURRENT SCENE</span>

          <strong>
            {
              sceneLabels[
                scene.primaryState
              ]
            }
          </strong>

        </div>

        <div className="scene-meters">
          <div>
            <span>ENERGY</span>
            <strong>
              {scene.energy.toUpperCase()}
            </strong>
          </div>

          <div>
            <span>TENSION</span>
            <strong>
              {scene.tension.toUpperCase()}
            </strong>
          </div>

          <div>
            <span>ATTENTION</span>
            <strong>
              {scene.attention.toUpperCase()}
            </strong>
          </div>
        </div>

        <div className="scene-prescription">
          <p>RECOMMENDED SHIFT</p>

          <h2>
            {modeLabels[mode]}
          </h2>

          <p>
            {sceneMessages[mode]}
          </p>

          <span>
            {challenge.duration} SEC ·{" "}
            {challenge.title}
          </span>

          {observations > 0 && (
            <div className="personalization-note">
              <div>
                <strong>↺ Personalized</strong>
                <span>
                  from {observations} previous{" "}
                  {observations === 1 ? "reset" : "resets"}
                </span>
              </div>

              <details>
                <summary>Why this?</summary>
                <p>
                  Scene: {sceneLabels[scene.primaryState]}
                  {" · "}Base: {modeLabels[baseMode]}
                  {" · "}Final: {modeLabels[mode]}
                </p>
                <p>
                  Learned mode signal:{" "}
                  {selectedModeBonus >= 0 ? "+" : ""}
                  {selectedModeBonus.toFixed(3)}
                  {" · "}Activity signal:{" "}
                  {selectedChallengeBonus >= 0 ? "+" : ""}
                  {selectedChallengeBonus.toFixed(3)}
                </p>
              </details>
            </div>
          )}

          <button
            className="primary"
            onClick={startBreak}
          >
            SHIFT MY SCENE →
          </button>
        </div>

        <div className="scene-correction">
          <p>Not quite?</p>

          <div>
            {corrections.map(
              ({ state, label }) => (
                <button
                  key={state}
                  className={
                    scene.primaryState ===
                    state
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    correctScene(state)
                  }
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Vibes() {
  const navigate = useNavigate();
  const cards = [
    ["⚡", "WAKE ME UP", "wake"],
    ["🌿", "SLOW ME DOWN", "slow"],
    ["😂", "MAKE ME LAUGH", "laugh"],
    ["🎨", "LET ME MAKE", "make"],
    ["🎲", "SURPRISE ME", "surprise"],
    ["✨", "RESET ME", "reset"],
  ];
  return (
    <main className="page">
      <Nav />
      <button className="back" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <section className="vibes">
        <p className="eyebrow">ONE CLICK IS ENOUGH</p>
        <h1>
          What does your
          <br />
          brain want?
        </h1>
        <div className="vibe-grid">
          {cards.map(([icon, name, vibe]) => (
            <button
              key={name}
              onClick={() =>
                navigate(
                  `/play?c=${encodeURIComponent(JSON.stringify(pick("", vibe)))}`,
                )
              }
            >
              <span>{icon}</span>
              {name}
              <b>→</b>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
function starter(
  ctx: CanvasRenderingContext2D,
  name: string,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.translate(
    w * (0.48 + (Math.random() - 0.5) * 0.1),
    h * (0.52 + (Math.random() - 0.5) * 0.1),
  );
  ctx.rotate((Math.random() - 0.5) * 0.18);
  ctx.scale(0.92 + Math.random() * 0.15, 0.92 + Math.random() * 0.15);
  ctx.strokeStyle = "#ab9bdd";
  ctx.fillStyle = "#f1ecff";
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 7]);
  const line = () => ctx.stroke();
  const circle = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    line();
  };
  const blob = () => {
    ctx.beginPath();
    ctx.moveTo(-93, 5);
    ctx.bezierCurveTo(-105, -75, -25, -105, 25, -72);
    ctx.bezierCurveTo(116, -105, 125, 63, 45, 75);
    ctx.bezierCurveTo(-60, 100, -115, 55, -93, 5);
    line();
  };
  if (name === "cloud") {
    [-50, 0, 53].forEach((x, i) =>
      circle(x, i === 1 ? -30 : 5, i === 1 ? 42 : 32),
    );
  } else if (name === "flower") {
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.cos(i) * 40, Math.sin(i) * 40, 22, 36, i, 0, 6.3);
      line();
    }
    circle(0, 0, 16);
  } else if (name === "fish") {
    ctx.beginPath();
    ctx.ellipse(-10, 0, 82, 45, 0, 0, 6.3);
    line();
    ctx.beginPath();
    ctx.moveTo(65, 0);
    ctx.lineTo(112, -45);
    ctx.lineTo(112, 45);
    ctx.closePath();
    line();
    circle(-48, -10, 5);
  } else if (name === "chair") {
    ctx.strokeRect(-45, -35, 90, 55);
    ctx.beginPath();
    ctx.moveTo(-35, 20);
    ctx.lineTo(-55, 83);
    ctx.moveTo(35, 20);
    ctx.lineTo(55, 83);
    ctx.moveTo(-45, -35);
    ctx.lineTo(-45, -88);
    line();
  } else if (name === "monster") {
    blob();
    circle(-25, -10, 11);
    circle(26, -12, 11);
    ctx.beginPath();
    ctx.moveTo(-15, 36);
    ctx.lineTo(20, 36);
    line();
  } else if (name === "potato") {
    ctx.beginPath();
    ctx.ellipse(0, 0, 82, 57, -0.12, 0, 6.3);
    line();
    circle(-25, -5, 3);
    circle(31, 20, 3);
  } else if (name === "room") {
    ctx.beginPath();
    ctx.moveTo(-130, 85);
    ctx.lineTo(-130, -85);
    ctx.lineTo(130, -85);
    ctx.lineTo(130, 85);
    ctx.moveTo(-130, 85);
    ctx.lineTo(130, 85);
    ctx.moveTo(20, 85);
    ctx.lineTo(20, 0);
    ctx.lineTo(85, 0);
    ctx.lineTo(85, 85);
    line();
  } else if (name === "flag") {
    ctx.beginPath();
    ctx.moveTo(-80, 85);
    ctx.lineTo(-80, -85);
    ctx.lineTo(75, -53);
    ctx.lineTo(-80, -18);
    line();
  } else if (name === "sun") {
    circle(0, 0, 42);
    for (let i = 0; i < 10; i++) {
      const a = i * 0.628;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 57, Math.sin(a) * 57);
      ctx.lineTo(Math.cos(a) * 85, Math.sin(a) * 85);
      line();
    }
  } else if (name === "egg") {
    ctx.beginPath();
    ctx.ellipse(0, 10, 60, 82, 0, 0, 6.3);
    line();
  } else if (name === "paw") {
    circle(0, 25, 35);
    [-35, 0, 35].forEach((x) => circle(x, -32, 13));
  } else if (name === "house") {
    ctx.beginPath();
    ctx.rect(-65, -5, 130, 88);
    ctx.moveTo(-83, -5);
    ctx.lineTo(0, -78);
    ctx.lineTo(83, -5);
    ctx.moveTo(-18, 83);
    ctx.lineTo(-18, 35);
    ctx.lineTo(18, 35);
    ctx.lineTo(18, 83);
    line();
  } else if (name === "button") {
    ctx.beginPath();
    ctx.roundRect(-80, -35, 160, 70, 35);
    line();
    circle(0, 0, 11);
  } else if (name === "shapes") {
    ctx.beginPath();
    ctx.moveTo(-90, 45);
    ctx.lineTo(-45, -45);
    ctx.lineTo(0, 45);
    ctx.closePath();
    line();
    circle(55, -15, 32);
    ctx.strokeRect(75, 25, 50, 50);
  } else if (name === "squiggle" || name === "waves") {
    ctx.beginPath();
    for (let i = 0; i < 8; i++)
      ctx.quadraticCurveTo(-150 + i * 42, -35 + (i % 2) * 65, -130 + i * 42, 5);
    line();
  } else if (name === "ears") {
    ctx.beginPath();
    ctx.moveTo(-65, 30);
    ctx.lineTo(-48, -65);
    ctx.lineTo(-10, -22);
    ctx.lineTo(10, -22);
    ctx.lineTo(48, -65);
    ctx.lineTo(65, 30);
    line();
  } else if (name === "circle" || name === "dot")
    circle(0, 0, name === "dot" ? 10 : 72);
  else blob();
  ctx.restore();
}
function Canvas({
  challenge,
  onFinish,
  onStroke,
  onPointer,
  onNearDot,
  onMood,
}: {
  challenge: Challenge;
  onFinish: (img: string) => void;
  onStroke: (n: number) => void;
  onPointer: (x: number, y: number) => void;
  onNearDot: (near: boolean) => void;
  onMood: (mood: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const history = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const drawing = useRef(false);
  const points = useRef(0);
  const circleStart = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState("#24211d");
  const [size, setSize] = useState(5);
  const [eraser, setEraser] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [nearDot, setNearDot] = useState(false);
  const limit =
    challenge.constraint === "five"
      ? 5
      : challenge.constraint === "three"
        ? 3
        : challenge.constraint === "one"
          ? 1
          : challenge.title === "THREE-CIRCLE FACE"
            ? 3
            : Infinity;
  const setCount = (n: number) => {
    setStrokes(n);
    onStroke(n);
  };
  const reset = () => {
    const c = ref.current!,
      x = c.getContext("2d")!,
      r = c.getBoundingClientRect();
    x.fillStyle = "#fffdf8";
    x.fillRect(0, 0, c.width, c.height);
    starter(x, challenge.starter, r.width, r.height);
    history.current = [x.getImageData(0, 0, c.width, c.height)];
    redo.current = [];
    setCount(0);
  };
  useEffect(() => {
    const c = ref.current!,
      x = c.getContext("2d")!,
      r = c.getBoundingClientRect(),
      ratio = devicePixelRatio;
    c.width = r.width * ratio;
    c.height = r.height * ratio;
    x.scale(ratio, ratio);
    reset();
  }, [challenge]);
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const begin = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (finishing || strokes >= limit) return;
    drawing.current = true;
    points.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    const x = e.currentTarget.getContext("2d")!,
      p = pos(e);
    circleStart.current = p;
    onPointer(
      (p.x / e.currentTarget.clientWidth - 0.5) * 8,
      (p.y / e.currentTarget.clientHeight - 0.5) * 6,
    );
    x.beginPath();
    x.moveTo(p.x, p.y);
    x.lineCap = "round";
    x.lineJoin = "round";
    x.strokeStyle = eraser ? "#fffdf8" : color;
    x.lineWidth = eraser ? size * 3 : size;
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const x = e.currentTarget.getContext("2d")!,
      p = pos(e);
    onPointer(
      (p.x / e.currentTarget.clientWidth - 0.5) * 8,
      (p.y / e.currentTarget.clientHeight - 0.5) * 6,
    );
    if (challenge.constraint === "follow") {
      const near =
        Math.hypot(
          p.x - e.currentTarget.clientWidth * 0.55,
          p.y - e.currentTarget.clientHeight * 0.55,
        ) < 115;
      if (near !== nearDot) {
        setNearDot(near);
        onNearDot(near);
      }
    }
    if (challenge.constraint === "circles") {
      points.current++;
      return;
    }
    x.lineTo(p.x, p.y);
    x.stroke();
    points.current++;
  };
  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    if (points.current) {
      const c = e.currentTarget;
      const x = c.getContext("2d")!;
      if (challenge.constraint === "circles" && circleStart.current) {
        const p = pos(e),
          start = circleStart.current;
        x.beginPath();
        x.arc(
          start.x,
          start.y,
          Math.max(8, Math.hypot(p.x - start.x, p.y - start.y)),
          0,
          Math.PI * 2,
        );
        x.stroke();
      }
      history.current.push(x.getImageData(0, 0, c.width, c.height));
      redo.current = [];
      setCount(strokes + 1);
    }
  };
  const restore = (way: "undo" | "redo") => {
    const c = ref.current!,
      x = c.getContext("2d")!;
    if (way === "undo" && history.current.length > 1) {
      redo.current.push(history.current.pop()!);
      x.putImageData(history.current.at(-1)!, 0, 0);
      setCount(Math.max(0, strokes - 1));
    } else if (way === "redo" && redo.current.length) {
      const im = redo.current.pop()!;
      history.current.push(im);
      x.putImageData(im, 0, 0);
      setCount(strokes + 1);
    }
  };
  let constraint = "";
  if (challenge.constraint === "one")
    constraint = strokes
      ? "That's the line. No take-backs."
      : "One continuous line. Go.";
  if (challenge.constraint === "five" || challenge.constraint === "three")
    constraint = `${Math.max(0, limit - strokes)} strokes left`;
  if (challenge.constraint === "circles")
    constraint =
      challenge.title === "THREE-CIRCLE FACE"
        ? strokes >= 3
          ? "Done. That's your face."
          : `${3 - strokes} circles left`
        : "Circle tool only — make every mark round.";
  if (challenge.constraint === "follow")
    constraint = "Follow the drifting dot. Easy does it.";
  return (
    <div className={`canvas-wrap ${finishing ? "canvas-finishing" : ""}`}>
      <canvas
        ref={ref}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="canvas-tools">
        <div>
          {["#24211d", "#f05f48", "#276ef1", "#8f72d6", "#4f9c62"].map((c) => (
            <button
              key={c}
              aria-label={`Use ${c} ink`}
              className={color === c && !eraser ? "selected" : ""}
              style={{ background: c }}
              onClick={() => {
                setColor(c);
                setEraser(false);
              }}
            />
          ))}
        </div>
        <div className="size-tools">
          {[3, 5, 10].map((s) => (
            <button
              key={s}
              aria-label={`Line size ${s}`}
              className={size === s ? "selected" : ""}
              onClick={() => setSize(s)}
            >
              <i style={{ width: s + 3, height: s + 3 }} />
            </button>
          ))}
        </div>
        <button
          className={eraser ? "tool active" : "tool"}
          onClick={() => {
            setEraser(!eraser);
            onMood("surprised");
            setTimeout(() => onMood("drawing"), 500);
          }}
        >
          ⌫ Erase
        </button>
        <button
          className="tool"
          onClick={() => {
            restore("undo");
            onMood("curious");
          }}
        >
          ↶
        </button>
        <button className="tool" onClick={() => restore("redo")}>
          ↷
        </button>
        <button
          className="tool"
          onClick={() => {
            setConfirm(true);
            onMood("worried");
          }}
        >
          Clear
        </button>
      </div>
      <button
        className="finish"
        onClick={() => {
          setFinishing(true);
          onMood("celebrate");
          setTimeout(() => onFinish(ref.current!.toDataURL("image/png")), 360);
        }}
      >
        FINISH <b>→</b>
      </button>
      {constraint && <p className="constraint">{constraint}</p>}
      {challenge.constraint === "follow" && (
        <i className={`follow-dot ${nearDot ? "is-near" : ""}`} />
      )}
      {confirm && (
        <div className="clear-confirm">
          <b>Erase this magnificent disaster?</b>
          <span>
            <button
              onClick={() => {
                reset();
                setConfirm(false);
                onMood("drawing");
              }}
            >
              erase it
            </button>
            <button
              onClick={() => {
                setConfirm(false);
                onMood("drawing");
              }}
            >
              absolutely not
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
function Play() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const c = useMemo(() => {
    try {
      return JSON.parse(params.get("c") || "");
    } catch {
      return pick();
    }
  }, [params]);
  const [seconds, setSeconds] = useState(c.duration);
  const [ignore, setIgnore] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [reaction, setReaction] = useState("drawing");
  const [nearDot, setNearDot] = useState(false);
  useEffect(() => {
    if (ignore || seconds === 0) return;
    const t = setTimeout(
      () => setSeconds((secondsRemaining: number) => secondsRemaining - 1),
      1000,
    );
    return () => clearTimeout(t);
  }, [seconds, ignore]);
  const mood =
    reaction !== "drawing"
      ? reaction
      : nearDot
        ? "idle"
        : seconds === 0
          ? "sleepy"
          : c.constraint === "five" && strokes >= 5
            ? "surprised"
            : "drawing";
  return (
    <main className="play">
      <Nav />
      <button className="back" onClick={() => navigate(-1)}>
        ← Back
      </button>
      {location.state?.message && (
        <p className="generator-line">{location.state.message}</p>
      )}
      <header className="challenge-head">
        <div>
          <p className="eyebrow">
            {seconds === 0 ? "TIME IS JUST A SUGGESTION" : "A TINY CHALLENGE"}
          </p>
          <h2>{c.title}</h2>
          <p>{c.instruction}</p>
        </div>
        <div className="timer">
          <strong>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </strong>
          <button onClick={() => setIgnore(true)}>
            {ignore ? "timer forgotten" : "Forget the timer"}
          </button>
        </div>
      </header>
      <div className="play-buddy">
        <Companion mood={mood} x={look.x} y={look.y} />
      </div>
      <Canvas
        challenge={c}
        onStroke={setStrokes}
        onPointer={(x, y) => setLook({ x, y })}
        onNearDot={setNearDot}
        onMood={setReaction}
        onFinish={(img) =>
          navigate(
            `/finish?c=${encodeURIComponent(
              JSON.stringify(c),
            )}`,
            {
              state: {
                img,
                session:
                  location.state?.session,
              },
            },
          )
        }
      />
    </main>
  );
}
function Finish() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const c = useMemo(
    () => JSON.parse(params.get("c") || JSON.stringify(challenges[0])),
    [params],
  );
  const img = (location.state as { img?: string } | null)?.img || "";
  const session = (
    location.state as {
      img?: string;
      session?: BreakSession;
    } | null
  )?.session;
  const [feedback, setFeedback] =
    useState<FeedbackOutcome | null>(null);

  const submitFeedback = (outcome: FeedbackOutcome) => {
    if (session) {
      // Immediate local update keeps the experience resilient
      // even if the network is temporarily unavailable.
      recordOutcome(
        session.scene,
        session.mode,
        outcome,
      );

      // Persist the same outcome in Supabase.
      void saveFeedback({
        scene: session.scene,
        mode: session.mode,
        outcome,
        challengeTitle:
          c.title,
        challengeDuration:
          c.duration,
        availableTime:
          session.availableTime,
        startedAt:
          session.startedAt,
      }).catch((error) => {
        console.warn(
          "Could not persist feedback; local personalization was still updated.",
          error,
        );
      });
    }

    setFeedback(outcome);
  };
  const [phase, setPhase] = useState<"choice" | "dissolve" | "gone">("choice");
  const completed = Number(sessionStorage.getItem("blink-completed") || "0");
  const nextCount = completed + 1;
  useEffect(() => {
    if (phase === "choice")
      sessionStorage.setItem("blink-completed", String(nextCount));
    if (phase === "dissolve") {
      const t = setTimeout(() => setPhase("gone"), 2100);
      return () => clearTimeout(t);
    }
  }, [phase]);
  const save = () => {
    const all: Saved[] = JSON.parse(
      localStorage.getItem("tiny-things") || "[]",
    );
    localStorage.setItem(
      "tiny-things",
      JSON.stringify([
        {
          id: crypto.randomUUID(),
          image: img,
          title: c.title,
          date: new Date().toLocaleDateString(),
          challenge: c,
        },
        ...all,
      ]),
    );
    navigate("/things");
  };
  const exitPrompt = nextCount >= 3;

  if (session && feedback === null) {
    return (
      <main className="finish-page">
        <Nav />

        <section className="scene-feedback">
          <Companion mood="curious" />

          <p className="eyebrow">
            FEEDBACK // 01
          </p>

          <h1>
            Ab scene
            <br />
            kaisa hai?
          </h1>

          <p>
            One tap. That's how the system
            learns your resets.
          </p>

          <div className="feedback-options">
            <button
              onClick={() =>
                submitFeedback("better")
              }
            >
              <span>🙂</span>
              BETTER
            </button>

            <button
              onClick={() =>
                submitFeedback("same")
              }
            >
              <span>😐</span>
              SAME
            </button>

            <button
              onClick={() =>
                submitFeedback("worse")
              }
            >
              <span>🙁</span>
              WORSE
            </button>
          </div>

          <small>
            This changes what Kya Scene Hai?
            tries next time.
          </small>
        </section>
      </main>
    );
  }

  return (
    <main className={`finish-page phase-${phase}`}>
      <Nav />
      <section>
        {phase === "choice" && (
          <>
            <Companion mood="celebrate" />
            <p className="eyebrow">TA-DA</p>
            <h1>
              {exitPrompt ? "Okay. Your brain got its snack." : c.completion}
            </h1>
            {img && (
              <img className="art-preview" src={img} alt="Your drawing" />
            )}
            <p>
              {exitPrompt
                ? "That's enough internet for a minute."
                : "What should happen to it?"}
            </p>
            <div className="actions">
              {exitPrompt ? (
                <button className="primary" onClick={() => navigate("/exit")}>
                  I'M OUT 👋
                </button>
              ) : (
                <>
                  <button className="primary" onClick={save}>
                    KEEP IT
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setPhase("dissolve")}
                  >
                    LET IT DISAPPEAR ✨
                  </button>
                </>
              )}
            </div>
            <button
              className="text-btn"
              onClick={() =>
                navigate(
                  `/play?c=${encodeURIComponent(JSON.stringify(pick()))}`,
                )
              }
            >
              {exitPrompt ? "okay, one last one" : "ONE MORE"}
            </button>
          </>
        )}
        {phase === "dissolve" && (
          <>
            <Companion mood="curious" />
            <div className="dissolve-art">
              {img &&
                Array.from({ length: 30 }, (_, index) => {
                  const column = index % 6;
                  const row = Math.floor(index / 6);
                  return (
                    <i
                      key={index}
                      className="art-fragment"
                      style={
                        {
                          left: `${column * 16.667}%`,
                          top: `${row * 20}%`,
                          backgroundImage: `url(${img})`,
                          backgroundPosition: `${column * 20}% ${row * 25}%`,
                          "--dx": `${((index * 37) % 180) - 90}px`,
                          "--dy": `${-80 - ((index * 29) % 150)}px`,
                          "--rot": `${((index * 19) % 40) - 20}deg`,
                          animationDelay: `${index * 0.025}s`,
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
            </div>
            <p className="eyebrow">POOF, GENTLY</p>
          </>
        )}
        {phase === "gone" && (
          <>
            <Companion mood="idle" />
            <h1>
              You didn't make it for anyone.
              <br />
              You just made it.
            </h1>
            <p>Feeling done?</p>
            <button className="primary" onClick={() => navigate("/exit")}>
              YEP, I'M GOOD
            </button>
            <button
              className="text-btn"
              onClick={() =>
                navigate(
                  `/play?c=${encodeURIComponent(JSON.stringify(pick()))}`,
                )
              }
            >
              ONE MORE
            </button>
          </>
        )}
      </section>
    </main>
  );
}
function Things() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Saved[]>(() =>
    JSON.parse(localStorage.getItem("tiny-things") || "[]"),
  );
  const del = (id: string) => {
    const n = items.filter((x) => x.id !== id);
    setItems(n);
    localStorage.setItem("tiny-things", JSON.stringify(n));
  };
  return (
    <main className="page things">
      <Nav />
      <section>
        <p className="eyebrow">PRIVATE, OBVIOUSLY</p>
        <h1>Tiny Things</h1>
        <p>Your little wall of made-up stuff. No audience required.</p>
        {items.length ? (
          <div className="things-grid">
            {items.map((x) => (
              <article key={x.id}>
                <img src={x.image} alt={x.title} />
                <p>
                  {x.title} · {x.date}
                </p>
                <div>
                  <button
                    onClick={() =>
                      navigate(
                        `/play?c=${encodeURIComponent(JSON.stringify(x.challenge))}`,
                      )
                    }
                  >
                    REPLAY THIS CHALLENGE
                  </button>
                  <a href={x.image} download={`${x.title}.png`}>
                    Download
                  </a>
                  <button onClick={() => del(x.id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Doodle>✎</Doodle>
            <h2>Nothing here. Beautiful.</h2>
            <Link className="primary link-button" to="/vibes">
              MAKE SOMETHING
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function Business() {
  return (
    <main className="page business-page">
      <Nav />

      <section className="business-hero">
        <p className="eyebrow">
          BUSINESS MODEL // FROM ONE RESET TO MANY
        </p>

        <h1>
          Useful for one person.
          <br />
          Scalable for learning communities.
        </h1>

        <p className="business-lead">
          Kya Scene Hai? starts as a free, low-friction
          micro-break tool for students and knowledge
          workers. Long-term revenue comes from premium
          personalization, institutional licensing and
          platform integrations.
        </p>

        <div className="business-value-line">
          <span>LAND WITH INDIVIDUALS</span>
          <b>→</b>
          <span>EXPAND THROUGH INSTITUTIONS</span>
          <b>→</b>
          <span>INTEGRATE INTO PLATFORMS</span>
        </div>
      </section>

      <section className="business-section">
        <div className="business-section-head">
          <div>
            <p className="eyebrow">WHO PAYS?</p>
            <h2>
              A simple
              <br />
              monetization ladder.
            </h2>
          </div>

          <p>
            The MVP stays easy to try. Revenue is added
            where users or organizations receive deeper
            personalization, deployment support or
            integration value.
          </p>
        </div>

        <div className="business-tier-grid">
          <article className="business-tier free-tier">
            <span>01 · FREE</span>
            <h3>Individuals</h3>
            <p>
              Students, developers and knowledge workers
              can use the core product with no friction.
            </p>
            <ul>
              <li>Scene detection</li>
              <li>20 sec–3 min resets</li>
              <li>Better / Same / Worse feedback</li>
              <li>Lightweight personalization</li>
            </ul>
            <strong>Goal: adoption + feedback</strong>
          </article>

          <article className="business-tier pro-tier">
            <span>02 · PRO</span>
            <h3>Power users</h3>
            <p>
              A future paid tier for users who want
              deeper history and stronger personalization.
            </p>
            <ul>
              <li>Longer-term reset history</li>
              <li>Advanced preferences</li>
              <li>Weekly personal insights</li>
              <li>Cross-device history</li>
            </ul>
            <strong>Pricing hypothesis: low-cost monthly plan</strong>
          </article>

          <article className="business-tier b2b-tier">
            <span>03 · B2B</span>
            <h3>Universities & EdTech</h3>
            <p>
              Institutional access for learning
              communities and digital education products.
            </p>
            <ul>
              <li>Campus / cohort access</li>
              <li>LMS or product integration</li>
              <li>Admin deployment support</li>
              <li>Privacy-safe aggregate insights</li>
            </ul>
            <strong>Goal: recurring institutional revenue</strong>
          </article>

          <article className="business-tier api-tier">
            <span>04 · API / SDK</span>
            <h3>Platforms</h3>
            <p>
              A future integration layer for productivity
              and learning products that want adaptive
              break recommendations inside their own UX.
            </p>
            <ul>
              <li>State-to-reset API</li>
              <li>Embedded feedback loop</li>
              <li>Usage-based or contracted access</li>
              <li>White-label integration potential</li>
            </ul>
            <strong>Goal: platform-scale distribution</strong>
          </article>
        </div>

        <p className="business-note">
          Pricing shown here is intentionally directional.
          The current hackathon MVP is validating product
          usefulness and personalization before final
          commercial pricing is set.
        </p>
      </section>

      <section className="business-section customer-section">
        <div className="business-section-head">
          <div>
            <p className="eyebrow">CUSTOMER SEGMENTS</p>
            <h2>
              Start narrow.
              <br />
              Expand carefully.
            </h2>
          </div>

          <p>
            The initial wedge is students and people doing
            cognitively demanding work. Institutional
            customers become relevant once the individual
            product proves useful.
          </p>
        </div>

        <div className="customer-grid">
          <article>
            <span>🎓</span>
            <strong>STUDENTS</strong>
            <p>Study fatigue, exam pressure, scattered focus and getting stuck.</p>
          </article>

          <article>
            <span>⌨</span>
            <strong>DEVELOPERS</strong>
            <p>Debugging loops, mental fatigue and context-lock during technical work.</p>
          </article>

          <article>
            <span>◫</span>
            <strong>KNOWLEDGE WORKERS</strong>
            <p>Short resets between cognitively demanding tasks without opening another feed.</p>
          </article>

          <article>
            <span>🏫</span>
            <strong>UNIVERSITIES</strong>
            <p>Privacy-conscious support for study habits across learning communities.</p>
          </article>

          <article>
            <span>◎</span>
            <strong>EDTECH</strong>
            <p>Adaptive breaks embedded into online learning journeys.</p>
          </article>

          <article>
            <span>↗</span>
            <strong>PRODUCTIVITY PLATFORMS</strong>
            <p>An API layer for state-aware reset recommendations.</p>
          </article>
        </div>
      </section>

      <section className="business-section economics-section">
        <div className="economics-copy">
          <p className="eyebrow">WHY THIS CAN START LEAN</p>
          <h2>
            Low infrastructure
            <br />
            overhead at MVP stage.
          </h2>
          <p>
            The current architecture uses a lightweight
            React frontend, Supabase and short structured
            Gemini calls. No paid always-on GPU server is
            required for the MVP.
          </p>
        </div>

        <div className="economics-flow">
          <div>
            <span>ACQUISITION</span>
            <strong>Student communities<br />+ organic sharing</strong>
          </div>
          <b>→</b>
          <div>
            <span>RETENTION</span>
            <strong>Better personalization<br />over repeated use</strong>
          </div>
          <b>→</b>
          <div>
            <span>MONETIZATION</span>
            <strong>Pro + institutional<br />+ API</strong>
          </div>
        </div>
      </section>

      <section className="business-section privacy-business">
        <div>
          <p className="eyebrow">
            PRIVACY IS PART OF THE BUSINESS MODEL.
          </p>
          <h2>
            Institutions get trends.
            <br />
            Not private thoughts.
          </h2>
        </div>

        <div className="privacy-business-card">
          <p>
            A future institutional dashboard should show
            aggregate product usage and outcome trends,
            not raw individual free-text input or private
            student state histories.
          </p>

          <div>
            <span>✓ Aggregate usage</span>
            <span>✓ Reset effectiveness trends</span>
            <span>✓ Cohort-level patterns</span>
            <span>× Raw personal input</span>
            <span>× Individual surveillance</span>
            <span>× Clinical profiling</span>
          </div>
        </div>
      </section>

      <section className="business-final">
        <p className="eyebrow">BUSINESS THESIS</p>
        <h2>
          Land with students.
          <br />
          Expand through institutions.
        </h2>
        <p>
          The product earns trust at the individual level
          first. Commercial scale comes after demonstrated
          usefulness, repeat engagement and privacy-safe
          deployment.
        </p>
        <Link to="/" className="business-home-link">
          TRY THE PRODUCT →
        </Link>
      </section>
    </main>
  );
}

function About() {
  return (
    <main className="page about">
      <Nav />
      <section>
        <p className="eyebrow">WHY THIS EXISTS</p>
        <h1>What if your break wasn't another feed?</h1>
        <p>
          We often open social media not because we care what's happening, but
          because our brain wants a tiny break.
        </p>
        <p>
          A two-minute break becomes thirty minutes of passive consumption. This
          is another possibility: <b>make something tiny instead.</b>
        </p>
        <div className="manifesto">
          <span>No audience.</span>
          <span>No algorithm.</span>
          <span>No performance.</span>
          <span>No pressure.</span>
        </div>
        <h2>Create, don't consume.</h2>
        <Link to="/vibes" className="primary link-button">
          MAKE SOMETHING →
        </Link>
      </section>
    </main>
  );
}
const worlds = [
  {
    id: "rain",
    icon: "🌧",
    title: "TOKYO RAIN",
    note: "neon through wet glass",
  },
  { id: "water", icon: "🌊", title: "UNDERWATER", note: "slow blue drift" },
  { id: "fire", icon: "🔥", title: "BY THE FIRE", note: "warm, low flicker" },
  { id: "space", icon: "🌌", title: "DEEP SPACE", note: "nothing needs you" },
  {
    id: "forest",
    icon: "🌲",
    title: "LOST IN THE FOREST",
    note: "quiet green air",
  },
];
function Worlds() {
  const navigate = useNavigate();
  return (
    <main className="world-select">
      <Nav />
      <button className="back" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <section>
        <p className="eyebrow">ONE-MINUTE WORLD</p>
        <h1>
          Where should we
          <br />
          disappear to?
        </h1>
        <p>Just one minute. Nothing to achieve.</p>
        <div className="world-grid">
          {worlds.map((world) => (
            <button
              key={world.id}
              className={`world-card ${world.id}`}
              onClick={() => navigate(`/world/${world.id}`)}
            >
              <i>{world.icon}</i>
              <strong>{world.title}</strong>
              <span>{world.note}</span>
              <b>→</b>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
function WorldExperience() {
  const navigate = useNavigate();
  const location = useLocation();
  const id = location.pathname.split("/").at(-1) || "rain";
  const world = worlds.find((item) => item.id === id) || worlds[0];
  const [left, setLeft] = useState(60);
  const [finished, setFinished] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [sound, setSound] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [depth, setDepth] = useState({ x: 0, y: 0 });
  const [drops, setDrops] = useState([{ id: 1, x: 30, y: 18 }, { id: 2, x: 76, y: 32 }, { id: 3, x: 58, y: 12 }]);
  const [dragging, setDragging] = useState<number | null>(null);
  useEffect(() => {
    if (finished) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, finished]);
  useEffect(() => {
    if (left <= 0) setFinished(true);
  }, [left]);
  const extend = () => {
    setLeft(30);
    setFinished(false);
  };
  return (
    <main
      className={`world-scene ${world.id}`}
      style={{ "--px": `${depth.x}px`, "--py": `${depth.y}px` } as React.CSSProperties}
      onPointerMove={(e) => { const rect=e.currentTarget.getBoundingClientRect(); const x=(e.clientX-rect.left)/rect.width-.5, y=(e.clientY-rect.top)/rect.height-.5; setLook({x:x*8,y:y*6}); setDepth({x:x*18,y:y*13}); if(dragging!==null)setDrops(ds=>ds.map(d=>d.id===dragging?{...d,x:(e.clientX-rect.left)/rect.width*100,y:Math.min(96,(e.clientY-rect.top)/rect.height*100)}:d)); }}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const ripple = { id: Date.now(), x: e.clientX - r.left, y: e.clientY - r.top };
        setRipples((all) => [...all, ripple]);
        setTimeout(() => setRipples((all) => all.filter((item) => item.id !== ripple.id)), 1000);
      }}
    >
      <div className="world-sky" />
      <div className="world-city" />
      <div className="world-mid" />
      <div className="world-lights" />
      <div className="rain-layer">
        {Array.from({ length: 44 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 23) % 100}%`,
              animationDelay: `-${(i % 13) * 0.37}s`,
              animationDuration: `${0.9 + (i % 5) * 0.18}s`,
            }}
          />
        ))}
      </div>
      <button className="world-back" onClick={() => navigate("/worlds")}>
        ←
      </button>
      <button
        className="sound-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setSound(!sound);
        }}
        aria-label="Toggle ambient sound"
      >
        {sound ? "◖ sound on" : "◖ sound off"}
      </button>
      <button
        className="world-progress"
        onClick={(e) => {
          e.stopPropagation();
          setShowTime(true);
          setTimeout(() => setShowTime(false), 1500);
        }}
        style={
          {
            "--progress": `${(Math.max(0, left) / 60) * 100}%`,
          } as React.CSSProperties
        }
      >
        {showTime && <span>{left} seconds left</span>}
      </button>
      {ripples.map((ripple) => <i key={ripple.id} className="glass-ripple" style={{ left: ripple.x, top: ripple.y }} />)}
      <div className="big-drops">{drops.map((drop) => <i key={drop.id} className={`big-drop ${dragging===drop.id?"dragging":""}`} style={{left:`${drop.x}%`,top:`${drop.y}%`}} onPointerDown={(e)=>{e.stopPropagation();setDragging(drop.id);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={()=>setDragging(null)} />)}</div>
      <div className="world-companion">
        <Companion mood="idle" x={look.x} y={look.y} />
      </div>
      {finished && (
        <div className="world-ending">
          <p>There. Somewhere else for a minute.</p>
          <button
            className="world-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/exit");
            }}
          >
            I'M GOOD
          </button>
          <button
            className="world-stay"
            onClick={(e) => {
              e.stopPropagation();
              extend();
            }}
          >
            STAY 30 SEC MORE
          </button>
        </div>
      )}
    </main>
  );
}
function Exit() {
  return (
    <main className="exit">
      <Companion mood="wave" />
      <p className="eyebrow">CREATE &gt; CONSUME.</p>
      <h1>Nice. Now go do literally anything else. 👋</h1>
      <p>See you when your brain needs another tiny break.</p>
      <Link to="/" className="text-btn">
        Back to the beginning
      </Link>
    </main>
  );
}
function Support() {
  return (
    <main className="exit support">
      <Companion mood="sleepy" />
      <p className="eyebrow">A TINY PAUSE</p>
      <h1>You deserve a little backup right now.</h1>
      <p>
        Please contact local emergency or crisis support, or reach out to
        someone you trust who can be with you.
      </p>
      <Link to="/" className="text-btn">
        Back to Kya Scene Hai?
      </Link>
    </main>
  );
}
export const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/scene", Component: SceneResult },
  { path: "/vibes", Component: Vibes },
  { path: "/play", Component: Play },
  { path: "/finish", Component: Finish },
  { path: "/things", Component: Things },
  { path: "/business", Component: Business },
  { path: "/about", Component: About },
  { path: "/exit", Component: Exit },
  { path: "/support", Component: Support },
  { path: "/worlds", Component: Worlds },
  { path: "/world/:id", Component: WorldExperience },
]);
