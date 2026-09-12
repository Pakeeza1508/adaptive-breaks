Improve the EXISTING product in place. Do NOT rebuild it from scratch and do NOT replace the current visual language, typography, routes, challenge library, or core concept.

The current version is a good foundation. This pass should focus on making the experience feel like an award-worthy Friends of Figma Make-a-thon prototype rather than adding lots of new screens.

The priority is:

**MAKE THE CORE LOOP FEEL MAGICAL, PLAYFUL, RESPONSIVE AND ACTUALLY FUNCTIONAL.**

Do not add authentication, profiles, social features, feeds, subscriptions, dashboards, streaks, points, or unnecessary features.

---

# 1 — FIX THE EXISTING FUNCTIONAL BUGS FIRST

Before adding visual polish, audit and repair all challenge mechanics.

### Fix the 20-second option

Currently the “I have 20 sec” option can select activities longer than 20 seconds because no suitable challenges exist.

Add several genuine 15–20 second activities such as:

* Draw a face using 3 circles.
* Turn one dot into something.
* Give this cloud a ridiculous hat.
* Draw the world's smallest monster.
* Add exactly 3 lines to this blob.
* Make this circle look annoyed.

When the user selects 20 sec, ONLY return an activity that fits within 20 seconds.

Fix the filtering logic so an empty filtered result never causes incorrect behavior.

---

# 2 — MAKE CONSTRAINTS REAL

The creative constraint is one of the most important parts of the product.

Do not merely display constraint text.

Actually enforce it.

### FIVE LINE challenge

Count completed pointer strokes.

Show:

5 strokes left
4 strokes left
3 strokes left...

After five strokes, drawing should stop.

Undo should correctly restore one available stroke.

### ONE LINE challenge

The user can draw exactly ONE continuous stroke.

After pointer-up, prevent another stroke.

Display:

**That's the line. No take-backs.**

Undo may reset the challenge.

### Additional constraint types

Extend the challenge engine so challenges can have real mechanics such as:

* maximum number of strokes
* one continuous stroke
* circles-only
* one color only
* three shapes only
* no curves
* no straight lines
* draw around a moving point
* complete an existing object

Do not fake a constraint using text when it can reasonably be implemented.

---

# 3 — STARTER ART MUST MATCH EACH CHALLENGE

The current implementation reuses a generic ellipse/blob for too many different starter types.

Replace this with a proper starter-art library.

Create recognizable but intentionally rough hand-drawn starter SVG/canvas drawings for:

cloud
blob
flower
fish
chair
monster
potato
room
flag
sun
egg
paw
house
button
geometric shapes
squiggle
circle
dot
waves
cat ears

Examples:

For “Design shoes for a fish,” actually place a simple fish on the canvas.

For “Make this monster employable,” actually show a small unfinished monster.

For “Turn this potato into a celebrity,” show a potato-shaped starting object.

For “Add something ridiculous to this boring room,” provide a minimal room outline.

For “Complete this mysterious squiggle,” provide a genuinely random squiggle.

Make starter objects vary slightly between sessions using rotation, scale, position, or procedural variation.

The user should immediately understand what they are supposed to interact with.

---

# 4 — MAKE THE NATURAL-LANGUAGE FEATURE FEEL INTELLIGENT

The text input is one of the hero features.

It should feel like:

**Tell the app what your brain needs → instantly receive the right tiny creative activity.**

Do not turn it into a chatbot.

Do not return paragraphs of advice.

Return ONE activity.

Upgrade the local activity generator so it can interpret broader semantic categories:

MENTALLY TIRED
BORED
RESTLESS
OVERSTIMULATED
UNFOCUSED
FRUSTRATED
CREATIVELY STUCK
WANTS SOMETHING SILLY
WANTS SOMETHING CALM
WANTS SOMETHING SURPRISING
HAS VERY LITTLE TIME
HAS A FEW MINUTES
DOESN'T KNOW WHAT THEY WANT

Recognize phrases beyond exact keywords.

Examples:

“my brain is fried after studying”
→ calming / low-thinking creative task

“I had the worst meeting”
→ playful decompression activity

“I don't want to think”
→ extremely simple visual task

“give me something stupid”
→ absurd/funny activity

“I've been staring at code all day”
→ tactile/visual activity requiring almost no language

“I only have 20 seconds”
→ micro activity <= 20 seconds

“I want to chill”
→ slower relaxing creative task

“I need chaos”
→ energetic strange activity

Before revealing the generated activity, show a SHORT transition response that feels personalized.

Examples:

**Okay. No thinking required.**

**You need something stupid. Got it.**

**45 seconds of nonsense coming up.**

**Let's get your brain out of work mode.**

**Tiny chaos? Excellent choice.**

Then reveal the activity.

Do NOT say:
“You appear stressed.”
“You may be experiencing anxiety.”
or anything diagnostic.

This is creative play, not mental-health diagnosis.

Keep a reliable local generator so the demo does not depend on an external AI API.

---

# 5 — UPGRADE THE COMPANION INTO A SIGNATURE CHARACTER

Keep the current original blob character, but greatly improve its personality and pseudo-3D quality.

Do not replace it with an emoji, stock illustration, or generic mascot.

Give it:

* soft dimensional shading
* subtle highlights
* soft contact shadow
* slightly asymmetric shape
* blinking
* breathing/squishing
* expressive pupils
* tiny feet if appropriate
* small elastic arms
* richer facial expressions

Add character states:

IDLE
CURIOUS
EXCITED
DRAWING
SURPRISED
CELEBRATE
WAVE
SLEEPY

### Cursor behavior

On the home screen:
the pupils should subtly look toward the pointer.

When hovering MAKE SOMETHING:
the character becomes excited.

When hovering SURPRISE ME:
the character looks suspicious/curious.

While drawing:
the character can appear as a small unobtrusive companion near the canvas and occasionally follow the cursor with its eyes.

Do NOT cover the artwork.

When five strokes are used:
react with a tiny surprised expression.

When time reaches zero:
do NOT alarm the user; character calmly shrugs.

On completion:
celebrate.

On exit:
wave.

Keep all reactions subtle enough that they feel delightful rather than distracting.

Respect prefers-reduced-motion.

---

# 6 — MAKE “LET IT DISAPPEAR” A HERO MOMENT

This should be one of the most memorable interactions in the entire product.

Currently do not simply hide the artwork and display decorative symbols.

When the user chooses:

**LET IT DISAPPEAR ✨**

animate THE ACTUAL USER ARTWORK.

Create a convincing visual dissolution:

1. artwork pauses
2. edges begin breaking apart
3. drawing fragments into many tiny dots / pieces / ink particles
4. particles float or scatter away
5. remaining canvas softly fades
6. companion watches the artwork disappear
7. companion gives a tiny satisfied reaction

Then reveal:

**You didn't make it for anyone.
You just made it.**

Do not immediately cut to another screen.

Give this moment breathing room.

The complete sequence should feel approximately 1.5–2.5 seconds and remain smooth.

If true particle extraction from the image is too unstable, create a reliable masked/fragmented visual approximation using the actual image rather than replacing it with generic stars.

---

# 7 — ADD THE PRODUCT'S MOST IMPORTANT RULE: HEALTHY EXIT

The app is intentionally NOT designed for infinite engagement.

Track completed activities during the current browser session.

After the user completes approximately 3 activities, change the completion flow.

Instead of prominently pushing another challenge, show:

**Okay. Your brain got its snack.**

Then:

**That's enough internet for a minute.**

Primary CTA:

**I'M OUT 👋**

Secondary tiny action:

**okay, one last one**

If the user chooses another one after that, allow it.

Do not lock them out.

But visually prioritize leaving.

Never add streaks, points or activity goals.

The philosophy is:

**good experience > long session**

---

# 8 — MAKE DIFFERENT ACTIVITIES FEEL DIFFERENT

Currently avoid making every challenge feel like:

prompt + same canvas + draw freely.

Introduce small variations while keeping the product simple.

Examples:

### FOLLOW THE DOT

A dot slowly moves around the canvas.
User draws behind it.

### COMPLETE THE BLOB

Starter blob already exists and user modifies it.

### FIVE STROKES

Canvas visually counts strokes.

### ONE-LINE CHAOS

Drawing ends after first stroke.

### SHAPE LIMIT

Give three draggable/drawable shapes and ask user to transform them.

### MAKE IT RIDICULOUS

Provide a recognizable starter illustration.

### SLOW DRAW

Cursor creates a softer delayed/smoothed line.

Do NOT create a complex game engine.

Just make enough challenge mechanics different that Surprise Me genuinely feels surprising.

---

# 9 — IMPROVE THE CANVAS DELIGHT

Keep the existing simple toolbar.

Do not make it professional drawing software.

Improve:

* smoother drawing interpolation
* better mobile pointer behavior
* clearer selected tool states
* playful cursor when appropriate
* very subtle paper texture
* responsive canvas size
* reliable undo/redo
* correct stroke counting after undo/redo
* no accidental page scroll while drawing on mobile

When pressing CLEAR show a tiny custom confirmation:

**Erase this magnificent disaster?**

Buttons:

**erase it**

**absolutely not**

Avoid browser-native alert().

---

# 10 — ADD MICROCOPY PERSONALITY

Use copy sparingly.

Possible rotating lines:

**No productivity required.**

**Make something objectively unnecessary.**

**Bad drawings welcome.**

**Talent is completely optional.**

**Nobody is grading this.**

**Please make something terrible.**

**Tiny nonsense counts.**

**Your portfolio never needs to know.**

Use only one or two at a time.

Do not overcrowd the design with jokes.

---

# 11 — FIRST-LOAD EXPERIENCE

Make the first 3 seconds memorable.

On first load only:

The companion peeks into the screen.

It notices the headline.

Then settles beside the hero.

Headline reveals subtly:

**Your brain deserves a tiny break.**

Do not create an onboarding modal.

Do not block interaction.

The user should still be able to press MAKE SOMETHING immediately.

---

# 12 — IMPROVE SURPRISE ME

SURPRISE ME should feel like a physical randomizer.

On click:

* button compresses
* companion reacts
* challenge cards/titles rapidly shuffle for ~400–600 ms
* final challenge snaps into place

Avoid long loading states.

Repeated clicks should not immediately repeat the previous challenge.

Maintain a short session history and avoid the last 3 challenges when possible.

---

# 13 — VIBE OPTIONS MUST ACTUALLY BE DISTINCT

Ensure each home/vibe selection has its own activity pool.

WAKE ME UP
→ fast, energetic, strange constraints

SLOW ME DOWN
→ continuous lines, patterns, calm visual motion

MAKE ME LAUGH
→ intentionally absurd prompts

LET ME MAKE
→ more creative/design-oriented activities

SURPRISE ME
→ unrestricted random selection

RESET ME
→ minimal low-cognitive-load activities

Do not map multiple buttons to effectively the same behavior.

---

# 14 — IMPROVE TINY THINGS WITHOUT GAMIFYING IT

Keep Tiny Things private.

Keep the fridge/sketchbook feeling.

Add:

**REPLAY THIS CHALLENGE**

to saved pieces.

Optionally slightly rotate saved cards differently.

Do NOT add:
likes
scores
streaks
badges
achievement counts
social sharing prompts

The empty state can say:

**Nothing here. Beautiful.**

---

# 15 — SAFETY FALLBACK FOR FREE-TEXT INPUT

This should remain almost invisible during normal use.

If free-text input contains a CLEAR statement of immediate self-harm intent or imminent danger, do not respond with a silly challenge.

Show a simple calm support screen encouraging the person to contact local emergency/crisis support or a trusted person.

Do not diagnose them.

Do not create risk percentages.

Do not add mental-health screening to the normal experience.

This is simply an edge-case safety fallback for unrestricted text input.

---

# 16 — BRAND / NAME

Do not automatically invent or change the product name during this refinement.

Keep the existing name only if it has already been intentionally chosen by the designer.

Otherwise preserve the current interface structure and leave naming easy to replace later.

The product philosophy must remain more prominent than the brand name:

**CREATE, DON'T CONSUME.**

---

# 17 — FINAL DEMO POLISH

After implementing the above, personally test these exact flows:

### Demo 1

Home
→ MAKE SOMETHING
→ FIVE-LINE CAT
→ actually draw exactly five strokes
→ sixth stroke is blocked
→ FINISH
→ LET IT DISAPPEAR
→ actual artwork visually dissolves
→ healthy completion state

### Demo 2

Home
→ type “my brain is fried after studying”
→ receive a low-thinking personalized challenge
→ complete it

### Demo 3

Home
→ I HAVE 20 SEC
→ receive a genuine <=20-second challenge

### Demo 4

SURPRISE ME three times
→ receive different challenges each time

### Demo 5

ONE-LINE CHAOS
→ first stroke works
→ second stroke is blocked

### Demo 6

Finish 3 activities in one session
→ healthy-exit recommendation appears

### Demo 7

Mobile viewport around 390 × 844
→ drawing, tool selection, timer, finish flow all remain usable

Fix any discovered bugs before adding anything else.

---

# IMPORTANT

Do NOT redesign the entire application.

Do NOT add more pages just to make the product appear bigger.

Do NOT make it look more corporate.

Do NOT make it look like a mental-health clinic.

Do NOT make the mascot childish.

Do NOT make engagement addictive.

Focus the remaining effort on:

**interaction quality
character
constraint mechanics
surprise
artwork dissolution
natural-language personalization
healthy exit**

The finished prototype should make someone want to show another person:

**“Look what this little thing does.”**
