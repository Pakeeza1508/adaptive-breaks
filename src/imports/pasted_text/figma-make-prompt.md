# FIGMA MAKE MASTER PROMPT

Build a polished, fully interactive, responsive web-app prototype for a Friends of Figma Make-a-thon based on the theme **Mental Health**.

IMPORTANT: This is NOT a depression app, therapy app, meditation app, diagnosis tool, mood tracker, clinical product, journaling platform, or AI therapist.

The central product philosophy is:

**CREATE, DON'T CONSUME.**

The product is a playful mental-refresh destination for moments when someone is bored, mentally tired, overstimulated, restless, low-energy, procrastinating, or instinctively about to open TikTok/Instagram and doomscroll.

Instead of consuming an endless stream of content, the user gets a tiny creative activity lasting approximately 20 seconds to 3 minutes.

The goal is:

**Open → make something tiny → experience delight → feel mentally refreshed → leave.**

The experience should feel playful, surprising, tactile, slightly weird, premium, joyful and human.

Do NOT make the interface look like a healthcare product.

Do NOT use hospital imagery, sad faces, clinical blue gradients, therapy language, depression terminology, medical icons, mental-health questionnaires, streaks, engagement farming, followers, likes or infinite scrolling.

---

# CORE BRAND PHILOSOPHY

Use these lines naturally throughout the experience:

**Create, don't consume.**

**A healthier answer to "I need a break."**

**Your brain deserves a tiny break.**

**Don't doomscroll. Make something.**

**You made a thing.**

**No likes. No pressure. No point. Just play.**

**You didn't make this for your portfolio. You made it because making something felt nice.**

For the final exit experience use playful language such as:

**Nice. Now go do literally anything else. 👋**

The product should deliberately encourage healthy exit rather than maximizing screen time.

---

# DESIGN DIRECTION

Create a visually distinctive, award-worthy design rather than a generic SaaS interface.

The aesthetic should combine:

* playful creative-tool energy
* premium modern editorial design
* tactile digital objects
* soft 3D elements
* hand-drawn details
* imperfect doodles
* generous whitespace
* bold typography
* tiny unexpected animations
* smooth micro-interactions
* expressive motion

Avoid making everything rounded and generic.

Create some irregular shapes, scribbles, hand-drawn arrows, torn-paper-inspired cards, floating doodles and tactile controls.

Use a warm off-white or very light neutral main background instead of pure white.

Use a vibrant but controlled accent palette containing approximately:

* warm yellow
* coral/orange
* lavender
* electric blue
* fresh green

Do not overload a single screen with all colors.

Typography should be large, expressive and editorial for headlines, paired with a highly readable modern sans serif for UI.

Make the interface feel youthful but NOT childish.

Think:
creative studio + playful digital toy + premium design experiment.

---

# 3D CHARACTER

Create a lovable original 3D companion character that becomes the visual personality of the experience.

Do NOT imitate an existing copyrighted character.

Character direction:

* abstract squishy blob-like creature
* small rounded body
* tiny arms and feet
* large expressive eyes
* simple mouth
* soft clay/plastic material
* slightly imperfect shape
* friendly but mischievous personality
* not overly cute or baby-like
* feels like a little creative companion living inside the interface

The character should react to user actions.

Implement it as actual lightweight 3D/WebGL if reliably possible.

Prefer Three.js or an equivalent lightweight implementation.

If true WebGL creates instability, create a convincing pseudo-3D character using layered SVG/CSS with shadows, highlights and transforms.

The prototype MUST still work if WebGL is unavailable.

Character interactions:

IDLE:
slow breathing/squish motion, occasional blink and slight head movement.

HOVER:
looks toward the hovered button or slightly follows the pointer.

START CHALLENGE:
small excited bounce.

WHILE USER DRAWS:
eyes loosely follow the cursor.

WHEN TIMER IS LOW:
slightly surprised expression, but never stressful.

WHEN FINISHED:
celebratory jump/spin.

WHEN ARTWORK IS DISCARDED:
watch it disappear, then give an approving little nod.

WHEN USER EXITS:
wave goodbye.

Do not make the character speak constantly.

Use tiny speech bubbles only at selected moments.

---

# MAIN INFORMATION ARCHITECTURE

Build these major experiences:

1. Welcome / Home
2. Instant random challenge
3. Choose-a-vibe experience
4. "Tell me what my brain needs" natural-language input
5. AI-style personalized challenge generation
6. Creative activity canvas
7. Challenge variations
8. Finish / celebration state
9. Keep or disappear interaction
10. Tiny private collection of saved creations
11. Healthy exit experience
12. Settings / accessibility controls

Do not create an endless content feed.

---

# 1. HOME SCREEN

Make this visually memorable.

Large hero headline:

**Your brain deserves a tiny break.**

Supporting line:

**Don't scroll. Make something tiny instead.**

Primary giant playful CTA:

**MAKE SOMETHING**

Secondary CTA:

**SURPRISE ME**

Below this, offer a much smaller text field:

**Tell me what your brain needs right now...**

Placeholder examples should rotate:

"my brain is fried"

"I'm bored"

"I need something silly"

"I can't focus"

"I have 30 seconds"

"give me something weird"

"I've been staring at work all day"

"I just want to draw"

Do NOT label this as a mental-health assessment.

Beside/around the hero area, show the 3D companion.

Add small floating doodles that subtly respond to pointer movement.

Include the line:

**No likes. No pressure. No point. Just play.**

No conventional dashboard.

---

# 2. QUICK VIBE SELECTOR

If the user wants help choosing an activity, display:

**What does your brain want?**

Use six expressive cards/buttons:

⚡ WAKE ME UP
🌿 SLOW ME DOWN
😂 MAKE ME LAUGH
🎨 LET ME MAKE
🎲 SURPRISE ME
✨ RESET ME

Each one should have a tiny hover animation.

Selecting one should immediately generate a suitable creative micro-challenge.

Do not make the user fill out multiple forms.

One click should be enough.

---

# 3. NATURAL-LANGUAGE "AI" EXPERIENCE

The user can type anything such as:

"I'm exhausted after studying."

"My brain won't stop thinking."

"I'm bored."

"I need something funny."

"I have only one minute."

"I feel creatively dead."

"I want something relaxing."

"I had a long day."

The interface should respond almost instantly.

Show a playful transition such as:

**Okay, I've got one.**

Then generate ONE suitable activity rather than giving advice.

Examples:

INPUT:
"My brain is fried after studying."

OUTPUT:
**NO THINKING ALLOWED**
Turn this random blob into the dumbest creature you can imagine.
Time: 45 seconds.

INPUT:
"I can't focus."

OUTPUT:
**ONE-LINE CHAOS**
Draw anything without lifting your finger.
Time: 30 seconds.

INPUT:
"I'm bored."

OUTPUT:
**BAD INVENTOR**
Design the world's least useful chair.
Time: 90 seconds.

INPUT:
"I need something calm."

OUTPUT:
**SLOW LINES**
Follow the floating dot and make one continuous relaxing line.
Time: 60 seconds.

INPUT:
"I feel annoyed."

OUTPUT:
**MAKE IT RIDICULOUS**
Here is an angry cloud. Add something that makes it impossible to take seriously.
Time: 45 seconds.

For the make-a-thon prototype, make this feature work reliably WITHOUT requiring an external API.

Implement a local intelligent activity generator that detects broad intent/categories from user text such as:

* tired
* bored
* stressed
* restless
* unfocused
* playful
* curious
* creative
* low energy
* short on time

Then select and slightly personalize an activity from a rich local activity library.

Structure the code so a real AI endpoint can be connected later.

If a backend/API integration is available, create an optional AI provider interface, but ALWAYS maintain the local generator as a fallback so the demo can never fail.

Never diagnose the user.

Never provide medical advice.

Never claim the user has depression/anxiety/etc.

The product only translates their current moment into a playful creative activity.

---

# 4. CHALLENGE LIBRARY

Build at least 25 working challenge definitions across multiple categories.

Examples:

DRAW:

* Draw a cat using only 5 lines.
* Make the ugliest flower possible.
* Draw something without lifting your finger.
* Draw a fish without using curves.
* Draw a monster afraid of humans.
* Draw your day using only shapes.
* Draw an animal with your non-dominant hand.
* Make this cloud look suspicious.
* Draw the world's least threatening dragon.

COMPLETE:

* Turn this blob into a character.
* Finish this half-drawn creature.
* Turn △ ○ □ into a tiny scene.
* Complete this mysterious squiggle.
* Add something ridiculous to this boring room.

TRANSFORM:

* Make this angry cloud happy.
* Turn this potato into a celebrity.
* Give this chair a personality.
* Turn this circle into something unexpected.
* Make this monster look employable.

DESIGN:

* Invent the world's worst chair.
* Design shoes for a fish.
* Design a house for something only 2 cm tall.
* Create a flag for Mondays.
* Invent a useless button.

CALM:

* Follow a slowly moving dot with your pencil.
* Create a pattern using only circles.
* Fill this shape with whatever lines feel nice.
* Draw waves without trying to make them perfect.
* Create one continuous slow line for 30 seconds.

Make challenge selection randomized enough that repeatedly pressing Surprise Me feels fresh.

---

# 5. CREATIVE CANVAS

The drawing activities MUST ACTUALLY WORK.

Use HTML canvas, SVG drawing or another reliable browser drawing implementation.

Support mouse and touch/pointer events.

The user must genuinely be able to draw.

Tools should stay deliberately limited.

Provide:

* pen
* eraser
* undo
* redo
* 3–5 playful color choices
* adjustable line thickness with only 3 sizes
* clear canvas
* finish button

Do NOT create a Photoshop-like toolbar.

The purpose is to reduce pressure.

For constraint challenges, actually enforce the constraint where reasonably possible.

Example:

"5 lines only"

Show:
**5 strokes left**

After each pointer-down → pointer-up drawing stroke, decrement the counter.

At zero, prevent additional drawing unless Undo is used.

For:

"Don't lift your finger"

End the drawing after the first completed stroke.

For timed challenges:

Display the timer visually but softly.

Do NOT use red warning flashes, alarming countdown sounds or stressful UI.

When the timer reaches zero, allow the user to finish naturally instead of abruptly deleting their work.

Include a small **Forget the timer** action because this is supposed to be relaxing.

---

# 6. RANDOM STARTING SHAPES

For appropriate challenges generate simple reusable starting objects such as:

* blobs
* circles
* squiggles
* half-creatures
* clouds
* rooms
* chairs
* abstract shapes
* geometric combinations

Randomize their orientation, position and selected form when possible.

This helps prevent blank-canvas anxiety.

The user should almost always have something to react to rather than facing an empty canvas.

---

# 7. MICRO-INTERACTIONS

This prototype should feel alive.

Implement:

* button compression on click
* subtle magnetic CTA movement
* playful hover distortion
* tiny doodle movement
* smooth screen transitions
* spring animations
* character reactions
* cursor-following eyes
* subtle canvas texture
* tiny floating particles after completion
* soft success animation
* drag interactions where useful
* animated text changes
* tactile toggle states

Keep motion smooth and tasteful.

Do NOT make every element move constantly.

Respect reduced-motion accessibility preferences.

---

# 8. COMPLETION MOMENT

When the user taps FINISH, do not assign a score.

Do not use stars.

Do not rank creativity.

Do not use AI to judge whether the drawing is good.

Instead create a delightful celebration.

Possible copy should rotate:

**You made a thing.**

**Look at that weird little thing.**

**Honestly? It exists. That's enough.**

**Tiny masterpiece unlocked.**

**No productivity achieved. Excellent.**

Have the 3D character celebrate.

Then ask:

**What should happen to it?**

Buttons:

**KEEP IT**

**LET IT DISAPPEAR ✨**

and a smaller:

**ONE MORE**

---

# 9. DISAPPEAR EXPERIENCE

This is a signature interaction.

When the user chooses:

**LET IT DISAPPEAR ✨**

Animate their artwork slowly breaking into tiny particles, scraps, ink dots, floating shapes, or dissolving fragments.

Make the animation beautiful and satisfying.

The character should watch it disappear.

Then show:

**You didn't make it for anyone.
You just made it.**

After approximately one second:

**Feeling done?**

CTA:

**YEP, I'M GOOD**

Secondary:

**ONE MORE**

---

# 10. KEEP EXPERIENCE

If user chooses KEEP IT:

Save it locally in browser/localStorage.

Create a private collection named something playful such as:

**Tiny Things**

Do NOT call it Portfolio.

Do NOT show likes, comments, followers or social metrics.

The saved-items page should resemble a little fridge/wall/sketchbook.

Allow:

* view
* delete
* download image if easily possible
* replay challenge

Keep this secondary to the main product.

Do NOT make collecting items addictive through streaks or achievements.

---

# 11. ANTI-ENGAGEMENT / HEALTHY EXIT

A core differentiator is that the app does not want infinite engagement.

After approximately 2–3 completed activities during the same session, gently suggest leaving.

Display:

**Okay, your brain got its snack.**

Then:

**Nice. Now go do literally anything else. 👋**

Large CTA:

**I'M OUT**

Small option:

**Okay one last one**

If the user chooses I'M OUT:

Show a beautiful minimal exit screen.

Character waves.

Copy:

**Create > consume.**

**See you when your brain needs another tiny break.**

Do not automatically load more content.

No infinite scrolling anywhere.

---

# 12. SESSION COUNTER

Track completed activities locally during the current session.

Do NOT gamify it as a streak.

Do NOT show "7-day streak" or pressure.

The count exists only so the product can intelligently encourage the user to exit after a few activities.

---

# 13. OPTIONAL "I HAVE..." SHORTCUT

Include a small quick control somewhere on Home:

**I have...**

20 sec
1 min
3 min

Selecting a duration should immediately choose an activity that realistically fits that time.

This makes the product useful during real micro-breaks.

---

# 14. ACCESSIBILITY

Implement:

* keyboard accessible controls
* visible focus states
* sufficient contrast
* reduced motion support
* touch-friendly canvas controls
* responsive font sizing
* descriptive button labels
* no interactions dependent entirely on color
* minimum comfortable touch targets

Make it usable on mobile.

---

# 15. RESPONSIVE BEHAVIOR

Design mobile-first but make desktop visually excellent.

Primary target:

390 × 844 mobile experience.

Also support:

tablet

desktop around 1440px width.

On desktop, use the extra space creatively:
3D character, floating doodles, larger canvas and editorial typography.

Do not simply stretch mobile cards across desktop.

---

# 16. NAVIGATION

Keep navigation very small.

Possible navigation:

Home
Tiny Things
About / Why this exists

Settings can live behind a small icon.

Do not add traditional product navigation with many sections.

---

# 17. ABOUT / PHILOSOPHY SCREEN

Build a concise storytelling page.

Headline:

**What if your break wasn't another feed?**

Explain:

We often open social media not because we care what's happening, but because our brain wants a tiny break.

A two-minute break becomes thirty minutes of passive consumption.

This product explores another possibility:

**Make something tiny instead.**

No audience.

No algorithm.

No performance.

No pressure.

Just a small act of creation.

End with:

**Create, don't consume.**

CTA:

**MAKE SOMETHING**

---

# 18. SAFETY BOUNDARY FOR NATURAL-LANGUAGE INPUT

Most text should simply generate a creative activity.

However, if a user types explicit language indicating immediate self-harm or imminent danger, do not generate a silly drawing challenge.

Instead show a calm, neutral safety state encouraging the person to contact local emergency/crisis support or someone they trust.

Keep this edge case contained.

Do not turn the rest of the product into a clinical interface.

Do not make diagnoses.

---

# 19. TECHNICAL IMPLEMENTATION

Build this as a functional prototype, not static screens.

Use clean component-based code.

Prefer reusable components for:

* buttons
* challenge cards
* drawing canvas
* timers
* modal states
* 3D companion
* prompt generator
* completion states
* saved creation cards

Use localStorage for saved drawings and lightweight preferences.

Use browser session state for session challenge count.

No authentication is required for this prototype.

No payment system.

No unnecessary backend.

The app must continue functioning after refresh where appropriate.

Ensure there are no dead buttons.

Every major CTA must perform a real action.

Every screen should be reachable through the prototype.

Make Back navigation work.

Handle empty states.

Handle timer completion.

Handle undo/redo.

Handle clearing canvas.

Handle saving.

Handle deleting saved items.

Handle Surprise Me repeatedly.

Handle natural-language input.

Handle mobile drawing.

Handle reduced motion.

---

# 20. AI-GENERATOR ARCHITECTURE

Create a function similar conceptually to:

generateActivity(userInput, selectedMood, availableTime)

It should classify the input into broad experiential needs and return:

title
instruction
challengeType
duration
constraint
starterShape
characterReaction
completionMessage

Create enough templates and combinations that the output does not feel repetitive.

Use small random variations.

Example result:

{
title: "NO THINKING ALLOWED",
instruction: "Turn this blob into the dumbest creature you can imagine.",
challengeType: "complete-shape",
duration: 45,
constraint: "none",
starterShape: "blob",
completionMessage: "Look at that weird little thing."
}

Do not expose technical JSON to the user.

---

# 21. DEMO PATH

Make the following exact demo flow especially polished because it will likely be shown to judges.

FLOW A — HERO EXPERIENCE

Home

User sees:
**Your brain deserves a tiny break.**

User taps:
**MAKE SOMETHING**

Challenge appears:

**5-LINE CAT**

**Draw a cat using only five lines.
It does not have to look like a cat.**

CTA:
**LET'S DO IT**

Interactive drawing canvas opens.

Counter:
**5 strokes left**

User draws five strokes.

3D character reacts.

User taps FINISH.

Celebration:

**You made a thing.**

User chooses:

**LET IT DISAPPEAR ✨**

Drawing beautifully dissolves.

Final message:

**You didn't make it for anyone.
You just made it.**

Then:

**Nice. Now go do literally anything else. 👋**

---

FLOW B — PERSONALIZED EXPERIENCE

Return Home.

User enters:

**my brain is fried after studying**

System transitions briefly:

**Okay. No thinking required.**

Generated activity:

**BLOB BUDDY**

**Turn this blob into the dumbest creature you can imagine.**

**45 sec**

User draws.

Finish animation.

---

FLOW C — SURPRISE

User taps:

**SURPRISE ME**

Instant unexpected challenge:

**BAD INVENTOR**

**Design the world's least useful chair.**

The whole transition should feel immediate, surprising and delightful.

---

# 22. FIRST-LOAD DELIGHT

When the prototype first opens:

Character should peek from outside the viewport edge.

Then slide/bounce in.

Headline should animate subtly.

Do NOT show a long onboarding flow.

Within five seconds the user should understand:

"I come here to make a tiny thing instead of scrolling."

---

# 23. SOUND

If browser-compatible and unobtrusive, include optional tiny interface sounds for:

* completing challenge
* disappearing artwork
* character celebration

Sound must be muted by default or have an obvious toggle.

Never use harsh notification sounds.

The application must still feel complete with sound disabled.

---

# 24. DETAILS THAT MAKE IT FEEL AWARD-WORTHY

Add tiny moments of personality.

Examples:

When user clicks Clear Canvas:

**Really erase this magnificent disaster?**

When nothing is saved:

**Nothing here. Beautiful.**

When Undo is pressed many times:

Character looks suspicious.

When user makes only one tiny mark:

Still celebrate it.

When user saves an odd-looking drawing:

Do not judge it.

If user lets a creation disappear:

Do not ask them to reconsider.

Occasionally use unexpected typography or doodles without damaging usability.

Make the experience screenshot-worthy.

---

# 25. IMPORTANT UX PRINCIPLES

Every design decision should reinforce:

LOW PRESSURE.

NO PERFORMANCE.

NO COMPARISON.

NO ENDLESS CONSUMPTION.

FAST ENTRY.

FAST REWARD.

CREATIVE PLAY.

HEALTHY EXIT.

The product should never feel like homework.

Never require artistic skill.

Never tell users to improve their drawing.

Never provide a creativity score.

Never compare one user to another.

Never ask users to post their creations publicly.

---

# 26. DO NOT BUILD

Do not add:

social feed
likes
comments
followers
profiles
leaderboards
daily streaks
points
XP
badges
subscriptions
therapy chatbot
diagnosis
mood statistics
medical reports
habit dashboards
productivity tasks
complex journaling
news/content feeds
infinite scrolling

These would undermine the product philosophy.

---

# 27. FINAL QUALITY PASS

After implementation, inspect the entire application yourself.

Fix:

broken interactions
overflow
mobile layout issues
canvas pointer bugs
dead buttons
timer edge cases
3D performance issues
poor contrast
inconsistent spacing
generic placeholder copy
unnecessary UI clutter

Prioritize the quality of the core loop over adding more screens.

The result should feel like a genuinely usable experimental product rather than a collection of static mockups.

The final experience should communicate this idea without requiring an explanation:

**When your brain asks for another feed, make something instead.**
