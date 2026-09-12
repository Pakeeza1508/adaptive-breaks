The CSS interaction polish is good. Preserve it.

However, the previous pass only edited `src/index.css`, which means the most important FUNCTIONAL interaction requirements were not implemented.

This pass MUST modify `src/routes.tsx`.

Do NOT spend this pass adding more hover styles or general CSS polish.

I specifically need interaction LOGIC connected to actual user actions.

Preserve all current functionality and the existing CSS improvements.

Implement ONLY the following 5 items.

---

# 1. REAL CIRCLE-DRAWING MECHANIC

Currently challenges with:

constraint === "circles"

still use the normal freehand drawing system.

Change this behavior.

When constraint === "circles":

* pointer down sets the center of a new circle
* pointer drag changes its radius
* pointer up commits the circle
* do NOT create a normal freehand path
* save each committed circle into undo history
* undo/redo must continue working

For:

THREE-CIRCLE FACE

allow exactly THREE committed circles.

After the third circle:
prevent a fourth circle from being added.

Update the constraint UI:

3 circles left
2 circles left
1 circle left
Done. That's your face.

CIRCLE WEATHER may allow unlimited circles.

This must be real canvas behavior, not instructional text.

---

# 2. MAKE FOLLOW-THE-DOT ACTUALLY INTERACTIVE

For:

constraint === "follow"

the moving dot currently only animates visually.

Connect it to pointer position.

While the user is drawing:

calculate approximate distance between the pointer and the moving dot.

If the pointer is reasonably close:

* add an `.is-near` state/class to the dot
* make dot softly glow/expand
* make companion mood become relaxed/happy
* optionally slightly smooth the user's line

If pointer moves farther away:

remove glow.

NO score.
NO failure.
NO red state.
NO warning.

The dot should simply feel aware that the user is following it.

---

# 3. CONNECT COMPANION TO LIVE DRAWING INPUT

The companion currently changes mood based primarily on timer/stroke state.

Upgrade it so its pupils react to the user's LIVE drawing pointer.

Canvas should report normalized pointer position to Play.

Use that to move the companion pupils subtly toward the drawing location.

Also implement these actual reactions:

* selecting Eraser → brief surprised expression
* Undo 3 times within a short period → curious/suspicious expression
* opening Clear confirmation → worried expression
* cancelling Clear → relaxed expression
* reaching final allowed stroke → celebratory/surprised reaction
* clicking Finish → celebrate before navigation

Do not add dialogue boxes.

Use eyes/body/expression.

---

# 4. REAL SURPRISE-ME SHUFFLE BEFORE NAVIGATION

Currently clicking Surprise Me sets a short CSS shuffle and then navigates.

Change the interaction logic.

On click:

1. Choose the final challenge first.
2. Stay on the Home page for approximately 700ms.
3. Display a temporary floating/inline challenge-title slot near the Surprise Me CTA.
4. Rapidly cycle through 4–6 random challenge titles.
5. Companion becomes excited.
6. On final frame, show the actual selected challenge title.
7. Then navigate to that exact selected challenge.

Do not select another random challenge after the animation.

The challenge shown at the end MUST be the challenge that opens.

Avoid repeating any of the recent titles already tracked by the application.

This should feel like a tiny slot machine, not a loading screen.

---

# 5. MAKE ARTWORK DISSOLUTION USE REAL FRAGMENTS

Current implementation mainly fades/blurs the complete image while a few generic dots move.

Replace the visual dissolve with fragments of the actual submitted drawing.

When phase === "dissolve":

Create approximately 24–36 fragment tiles.

Each fragment should:

* show the correct portion of the submitted artwork
* begin perfectly aligned with all other fragments so together they recreate the original image
* have its own deterministic/random translation
* have its own slight rotation
* have a staggered animation delay
* fade/shrink as it moves

Use CSS background-image/background-position or clipped image regions.

The user should initially see their intact artwork.

Then the ACTUAL ARTWORK should visibly break apart into pieces.

After approximately 2 seconds:
transition to the existing `gone` state.

Do not use only decorative particles.

Keep reduced-motion fallback as a simple fade.

---

# FINISH BUTTON TRANSITION

Also make one small but important change:

When FINISH is clicked:

do NOT navigate immediately.

Set a finishing state.

For approximately 300–400ms:

* canvas lifts/scales slightly
* companion celebrates
* finish button compresses
* drawing interaction becomes disabled

Then navigate to Finish with the same image data.

Do not lose the user's image.

---

# TECHNICAL REQUIREMENT

This pass MUST edit `src/routes.tsx`.

It may also edit `src/index.css` where styles are needed.

Do not consider the task complete if only CSS was modified.

After implementation verify:

1. THREE-CIRCLE FACE physically allows exactly 3 circles.
2. Normal dragging does not freehand-draw in circles mode.
3. Follow dot reacts to pointer proximity.
4. Companion eyes follow the canvas pointer.
5. Surprise Me visibly cycles challenge titles before opening the final one.
6. The displayed final shuffle title matches the opened challenge.
7. Finish waits for its animation before navigating.
8. User artwork genuinely fragments during dissolve.
9. Undo/redo still works.
10. Five/three/one-stroke constraints still work.
11. Production build passes.

Do not add anything else in this pass.
