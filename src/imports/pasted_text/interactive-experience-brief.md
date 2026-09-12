The product is functionally much better now, but it still FEELS too static.

Do NOT add more pages, more challenges, dashboards, features, dependencies, or major architecture changes.

Do NOT redesign the product.

Your task now is purely:

# MAKE THE EXISTING EXPERIENCE FEEL PHYSICAL, TACTILE, PLAYFUL AND HIGHLY INTERACTIVE.

Keep editing only the existing relevant files where possible:

* src/routes.tsx
* src/index.css

Preserve all current functionality.

The problem is not lack of features. The problem is that too many interactions currently feel like:
click → route changes
or
draw → finish.

I want the prototype to feel alive before, during and after every action.

---

# 1. MAKE THE HOME SCREEN REACT TO THE USER

The home screen should feel like an interactive playground even before clicking anything.

Add subtle pointer-reactive depth:

* hero doodles move at different parallax speeds
* halo shifts slightly opposite the cursor
* companion body subtly leans toward cursor
* companion eyes continue tracking cursor
* speech bubble gently reacts to nearby pointer movement
* hero headline may shift only 1–2px for depth, not enough to hurt readability

Do not make the page chaotic.

The user should immediately notice:
“this thing is responding to me.”

---

# 2. MAKE BUTTONS TACTILE

Current hover states are too conventional.

Improve important CTAs:

MAKE SOMETHING
SURPRISE ME
vibe cards
FINISH
KEEP IT
LET IT DISAPPEAR

Add:

* slight magnetic pull when pointer approaches
* springy press depth
* shadow compression on pointer down
* tiny rotation variation
* arrow/icon physically moves separately from button text
* release should spring back

Do this using lightweight React/CSS, no animation library required.

Maintain keyboard accessibility.

---

# 3. MAKE SURPRISE ME A REAL EXPERIENCE

Currently Surprise Me mostly shakes the button and navigates.

Instead:

When clicked:

1. companion reacts immediately
2. several challenge titles rapidly flash/slot through in the hero area
3. background accent changes slightly during shuffle
4. doodles jiggle
5. final challenge locks into place
6. THEN transition into the challenge

Total duration roughly 600–900ms.

Example rapid text:

UGLY FLOWER CLUB
FISH SHOES
ONE-LINE CHAOS
BAD INVENTOR
→ final selection

Do not add a loading spinner.

It should feel like pulling a playful slot machine.

---

# 4. MAKE VIBE CARDS INTERACTIVE OBJECTS

The vibe page is currently a grid of buttons.

Make each card behave differently on hover.

Examples:

WAKE ME UP
→ tiny lightning movement / energetic shake

SLOW ME DOWN
→ card gently floats

MAKE ME LAUGH
→ icon tilts or unexpectedly flips

LET ME MAKE
→ tiny scribble appears

SURPRISE ME
→ icon rotates unpredictably

RESET ME
→ visual elements settle into alignment

Also have the mascot react differently when each vibe is hovered.

Do not use large looping animations.

Interactions should happen because the user interacted.

---

# 5. CHALLENGES MUST HAVE DIFFERENT PHYSICAL MECHANICS

This is the highest-priority improvement.

Right now many challenge types still feel like the same drawing canvas with different instructions.

Make at least these mechanics genuinely different.

## A. CIRCLES challenge

When constraint === "circles":

Do NOT allow normal freehand drawing.

Pointer-down + drag should create/rescale a circle.

Each circle should feel like placing a bubble/stamp.

Allow multiple circles.

This makes:

THREE-CIRCLE FACE
CIRCLE WEATHER

feel genuinely different from normal drawing.

For THREE-CIRCLE FACE enforce exactly 3 placed circles.

---

## B. FOLLOW challenge

For SLOW LINES:

The moving dot must become part of the interaction.

While drawing:

* the dot slowly moves
* if user's pointer stays reasonably near it, the dot glows softly
* line becomes slightly smoother
* companion appears relaxed

If pointer moves far away:
nothing bad happens.
No failure state.
The glow simply fades.

No scores.

No red warnings.

This should feel meditative and tactile.

---

## C. ONE-LINE challenge

While drawing one continuous line:

* line should have slight smoothing/inertia
* companion eyes follow the live drawing pointer
* subtle visual trail appears behind the newest part of the line
* after pointer-up, the canvas gently settles and prevents another stroke

Make the completion of the one line feel satisfying.

---

## D. THREE/FIVE STROKE challenge

Each completed stroke should create a tiny physical response:

stroke 1 → tiny tick
stroke 2 → companion notices
stroke 3 → small wobble
last allowed stroke → subtle celebratory bounce

Do not use sounds unless enabled.

The remaining-strokes indicator should visually update with a tiny spring animation rather than only changing text.

---

# 6. MAKE STARTER ART REACTIVE

The starter objects should not look completely dead.

Do NOT constantly animate them.

Instead:

When the pointer gets close to an unfinished starter object:

* tiny wobble
* slight highlight
* or very subtle scale response

Examples:

monster's eyes can look toward pointer

cloud can slightly puff

fish tail can move once

potato can wobble

sun rays can rotate a few degrees

chair can tilt slightly

These can be DOM/SVG overlays if manipulating pixels inside canvas is difficult.

Keep performance reliable.

---

# 7. THE COMPANION SHOULD PARTICIPATE IN THE DRAWING

Currently the companion changes mood but feels separate from the activity.

Improve it.

During drawing:

* eyes track the user's drawing pointer
* body subtly leans toward canvas activity
* after every few seconds it blinks/reacts
* when user selects eraser, companion looks briefly surprised
* when undo is clicked repeatedly, companion becomes suspicious
* when clear confirmation appears, companion looks worried
* when user cancels clear, companion relaxes
* when user finishes, companion reacts BEFORE navigation

Do not make it talk constantly.

The character should communicate mostly through body/eyes.

---

# 8. ADD TRANSITIONS BETWEEN PRODUCT STATES

Routes currently feel too much like separate pages.

Create lightweight animated transitions so the experience feels continuous.

Examples:

Home → Vibes:
hero content gently moves left/fades while vibe cards arrive.

Vibes → Play:
selected vibe card visually expands or transitions toward the challenge header.

Play → Finish:
canvas slightly scales down and the completion page emerges.

Finish → Exit:
content settles/fades into the quieter exit screen.

Do NOT introduce heavy page-transition frameworks.

CSS + small React transition state is enough.

Avoid long transitions.
Aim around 250–450ms.

---

# 9. MAKE FINISH FEEL EARNED

When FINISH is clicked:

Do not immediately navigate.

For ~350ms:

* drawing canvas slightly lifts
* border/shadow changes
* companion celebrates
* FINISH arrow moves
* canvas gets a tiny rotation or scale
* then transition to Finish page

This should create anticipation.

---

# 10. UPGRADE ARTWORK DISSOLUTION SIGNIFICANTLY

Current dissolve still feels like a simple fade with a handful of decorative particles.

Make it one of the hero interactions.

Use the actual submitted image.

Without adding a heavy dependency, create a more convincing fragmentation effect.

Possible method:

* render 20–40 clipped fragments/tiles of the artwork
* each fragment uses the artwork image as its background
* fragments start aligned so they initially look like the original artwork
* gradually scatter with different translation/rotation/opacity values
* some fragments fall
* some float upward
* some shrink
* final canvas fades away

Keep total effect around 1.8–2.4 seconds.

The artwork must visibly break apart.

Do not simply fade the entire image while unrelated particles move.

The companion should visually watch the fragments leave.

Respect reduced-motion:
reduced-motion users should get a simple fade.

---

# 11. ADD POINTER / CURSOR PERSONALITY

On desktop, add a lightweight custom cursor treatment only where useful.

Examples:

over canvas:
small pencil-tip / dot cursor

over Surprise Me:
small sparkle follows cursor

over Let It Disappear:
cursor gets tiny dissolving dots

Do not replace the cursor globally if it hurts usability.

Do not do this on touch devices.

---

# 12. ADD OPTIONAL MICRO-SOUND ARCHITECTURE

Do not autoplay sound.

Add a small sound toggle, OFF by default.

If enabled, use extremely subtle generated/Web Audio sounds for:

* button press
* last allowed stroke
* finish
* artwork dissolution

No external audio files are required.

No harsh notification sounds.

The experience must remain complete with sound OFF.

If this would destabilize the build, skip sound and prioritize visual interaction.

---

# 13. MAKE MOBILE INTERACTIONS FEEL GOOD TOO

Do not build desktop-only delight.

On mobile:

* buttons should compress on touch
* canvas should never scroll the page while drawing
* companion reactions should not cover canvas
* no hover-only information
* challenge transitions still work
* Surprise Me still has a short tactile shuffle
* controls should remain thumb-friendly

Use pointer events so desktop and touch share logic where possible.

---

# 14. IMPORTANT: DO NOT FAKE INTERACTIVITY

If a constraint says circles only, actually make circles.

If a dot says follow me, actually make pointer proximity affect it.

If the mascot is described as reacting, connect it to real interaction state.

If artwork dissolves, use the actual artwork.

Do not implement these only through labels or decorative animations.

---

# 15. KEEP THE PRODUCT RESTRAINED

Do NOT turn it into a game.

No points.
No XP.
No scores.
No combo multipliers.
No leaderboard.
No achievements.
No confetti everywhere.

The emotional target is:

playful
tactile
surprising
calm
human
slightly weird

NOT:
mobile game.

---

# FINAL QUALITY BAR

After this pass, I should be able to spend 30 seconds on the homepage without navigating anywhere and still discover small responsive moments.

And when I enter a challenge, each interaction should make me feel that the interface noticed what I did.

The product should demonstrate:

**Create, don't consume**

not only through copy, but through interaction design.

Before finishing, test:

* Home pointer response
* every vibe hover/touch state
* Surprise Me shuffle
* circles challenge
* one-line challenge
* follow-the-dot challenge
* five-stroke challenge
* mascot reactions
* Finish transition
* artwork fragmentation
* mobile touch drawing
* reduced motion

Preserve every currently working feature and ensure production build still passes.
