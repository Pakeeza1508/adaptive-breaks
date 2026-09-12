Continue improving the EXISTING working prototype.

Do NOT rebuild the app from scratch.
Do NOT redesign the existing creative challenge flow.
Do NOT remove or replace the current “Create, don’t consume” experience.

Add one new complementary mode:

# ONE-MINUTE WORLD

This is a short sensory reset for moments when the user does not feel like creating.

The idea is:

**Sometimes your brain doesn’t want to make something. It just wants to go somewhere else for a minute.**

This should feel like a calm, immersive, interactive escape — NOT meditation, therapy, treatment, or a wellness questionnaire.

The product now has two complementary paths:

1. MAKE SOMETHING
2. ESCAPE FOR A MINUTE

Preserve the existing visual identity, mascot, routes, challenge engine, canvas, Tiny Things, healthy exit, safety fallback, and all current functionality.

Prefer modifying:

* src/routes.tsx
* src/index.css

Do not add heavy libraries unless absolutely necessary.

---

# 1. HOME INTEGRATION

Keep the existing main hero focused on:

**Your brain deserves a tiny break.**

**Don’t scroll. Make something tiny instead.**

Do not weaken MAKE SOMETHING as the primary action.

Add a secondary area beneath or near the existing creative controls:

**Not feeling creative?**

CTA:

**TAKE ME SOMEWHERE →**

This should feel quieter than MAKE SOMETHING.

It should not compete visually with the primary CTA.

Clicking it opens the One-Minute World selector.

---

# 2. WORLD SELECTOR

Create a new route/page such as:

/worlds

Headline:

**Where should we disappear to?**

Supporting copy:

**Just one minute. Nothing to achieve.**

Show five immersive world cards:

🌧 TOKYO RAIN
🌊 UNDERWATER
🔥 BY THE FIRE
🌌 DEEP SPACE
🌲 LOST IN THE FOREST

Each card should preview the personality of its environment.

Examples:

TOKYO RAIN

* subtle rain streak animation
* distant neon glow

UNDERWATER

* small bubbles
* slow floating motion

BY THE FIRE

* ember animation
* warm glow

DEEP SPACE

* star parallax
* tiny constellation movement

LOST IN THE FOREST

* fireflies
* slow leaf movement

Cards should react subtly to pointer/touch.

Do not make this another content feed.

---

# 3. IMPLEMENT ONE HERO WORLD FULLY FIRST

Build TOKYO RAIN as the fully polished working experience.

The other four worlds may initially use lighter implementations, but they should still be selectable and visually distinct.

Do not spend most of the effort building five mediocre environments.

TOKYO RAIN should be competition-demo quality.

---

# 4. TOKYO RAIN EXPERIENCE

Create a dedicated immersive route/state.

The interface should transition away from the normal app chrome.

Remove most visible navigation during the experience.

The screen should become an atmospheric rainy Tokyo window scene.

Visual direction:

* dark evening city
* soft neon reflections
* rain running down glass
* blurred distant buildings
* occasional soft light movement
* subtle depth/parallax
* premium, minimal, cinematic
* no copyrighted signs or real logos required

Do not use a static stock-image feeling.

Prefer building the scene with layered CSS/SVG/DOM effects so it feels alive.

---

# 5. RAIN INTERACTION

The world must respond to the user.

Implement lightweight pointer interaction:

* cursor movement slightly shifts foreground/background layers for parallax
* rain streaks continue independently
* clicking/tapping the glass creates a temporary ripple or raindrop response
* nearby reflections may subtly distort
* the interaction should feel calm, not game-like

No score.
No goal.
No success state.

The user is just being somewhere.

---

# 6. AMBIENT SOUND

Add an optional sound toggle.

Sound must be OFF by default.

If enabled:

TOKYO RAIN:

* gentle rainfall ambience
* optional very distant urban atmosphere

Prefer Web Audio/generated ambience or lightweight browser-compatible implementation.

Do not autoplay sound.

Do not require external copyrighted audio.

The experience must still feel complete with sound disabled.

---

# 7. MASCOT IN THE WORLD

Include the existing companion subtly.

Do not make it the center of attention.

For TOKYO RAIN:

The mascot could sit near the bottom/window edge and quietly watch the rain.

Behavior:

* slow breathing
* occasional blink
* eyes may follow a nearby raindrop or pointer
* very subtle movement
* no constant speech bubbles

The mascot should reinforce companionship without distracting from the environment.

---

# 8. TIME EXPERIENCE

Do NOT show a stressful countdown by default.

The experience lasts approximately 60 seconds.

Represent time using a quiet visual progress indicator.

Examples:

* thin line slowly progressing
* small circular ring
* tiny moon/sun arc
* subtle progress around a corner icon

Do not display:
00:59
00:58
00:57
unless the user explicitly taps the progress indicator.

If tapped, briefly reveal:

**42 seconds left**

Then hide it again.

---

# 9. ENDING

At approximately 60 seconds, do not abruptly kick the user out.

Let the environment settle slightly.

Show:

**There. Somewhere else for a minute.**

Then:

Primary:
**I’M GOOD**

Secondary:
**STAY 30 SEC MORE**

If user chooses I’M GOOD:
go to the existing healthy exit experience.

If user chooses STAY 30 SEC MORE:
continue the same environment for another 30 seconds.

After that extension, strongly prioritize exit.

Do not automatically load another world.

---

# 10. OTHER FOUR WORLDS

Create lighter but functional versions using the same World component architecture.

## UNDERWATER

Visuals:

* deep blue layered background
* floating particles
* bubbles
* soft distant silhouettes
* light rays from above

Interaction:

* pointer movement has slightly buoyant lag
* click/tap creates a small bubble cluster
* mascot gently floats

Ambient sound if enabled:

* soft underwater muffled ambience

---

## BY THE FIRE

Visuals:

* fireplace glow
* animated flame layers
* floating embers
* warm shadows

Interaction:

* click near the fire creates a small spark
* nearby glow responds slightly to pointer movement

Mascot:

* sits quietly nearby

Ambient sound if enabled:

* soft fire crackle

---

## DEEP SPACE

Visuals:

* star field
* subtle nebula gradients
* slow parallax layers
* occasional tiny shooting star

Interaction:

* pointer creates gentle star parallax
* clicking empty space temporarily draws a tiny constellation between nearby stars

No scoring or saving.

Copy can occasionally show:

**Nothing needs your attention here.**

---

## LOST IN THE FOREST

Visuals:

* soft forest layers
* light shafts
* subtle leaf movement
* fireflies

Interaction:

* pointer gently attracts one firefly
* click/tap can create one temporary small flower or glowing leaf

Ambient sound if enabled:

* soft wind/birds/forest ambience

---

# 11. WORLD ARCHITECTURE

Do not create five completely separate duplicated pages.

Create reusable data/config for each world.

Example conceptual structure:

WorldConfig:

* id
* title
* icon
* backgroundType
* duration
* accent
* mascotMood
* ambientType
* interactionType

Create a reusable:

<WorldExperience world={...} />

component.

Each world can customize:

* visual layers
* interaction behavior
* ambience
* small copy

Keep the architecture lightweight.

---

# 12. KEEP THE PRODUCT PHILOSOPHY CLEAR

This new mode should complement, not replace:

**Create, don’t consume.**

The new idea is:

**If you don’t want to create, just go somewhere quiet for a minute.**

Possible supporting copy:

**Make something, or disappear for a minute.**

**Not every break needs a feed.**

**Nothing to achieve here.**

**One minute. No algorithm.**

Do not use all of these at once.

---

# 13. NO INFINITE WORLD-HOPPING

Do NOT turn worlds into another scrollable content experience.

After finishing one world:

do not automatically suggest:
Next world
Next world
Next world

The healthy-exit philosophy remains important.

One world should feel complete.

The product should still encourage the user to leave afterward.

---

# 14. ACCESSIBILITY / PERFORMANCE

Respect prefers-reduced-motion.

For reduced-motion:

* minimize parallax
* reduce rain/particle movement
* use gentle fades instead

Ensure mobile touch works.

Avoid GPU-heavy effects that make the prototype lag.

No giant video files.

No autoplay audio.

Worlds should remain usable on a typical mobile device.

---

# 15. MOBILE

On mobile:

* make the environment full-screen
* hide unnecessary navigation
* touch ripple interactions should work
* sound toggle accessible
* progress indicator reachable
* ending buttons thumb-friendly

No hover-only functionality.

---

# 16. DEMO PATH

Make this exact path especially polished:

Home

→ user sees:
**Not feeling creative?**

→ taps:
**TAKE ME SOMEWHERE**

→ World selector

→ chooses:
🌧 **TOKYO RAIN**

→ transition into immersive rain scene

→ subtle rain begins

→ pointer/touch affects depth

→ tap glass creates ripple

→ optional sound toggle exists

→ mascot quietly reacts

→ visual one-minute progress completes

→ ending appears:

**There. Somewhere else for a minute.**

→ user taps:
**I’M GOOD**

→ existing healthy exit experience

This flow should feel coherent with the rest of the product.

---

# 17. IMPORTANT

Do NOT redesign the existing app.

Do NOT weaken the creative challenge flow.

Do NOT add meditation instructions.

Do NOT add breathing exercises.

Do NOT add wellness scores.

Do NOT add streaks.

Do NOT add world collections or achievements.

Do NOT add a content feed.

Do NOT add unnecessary dependencies.

This is an interaction/design expansion, not a product rewrite.

---

# FINAL QUALITY BAR

The One-Minute World experience should communicate:

**“I opened this because my brain wanted a break, and for one minute I genuinely went somewhere else.”**

Prioritize TOKYO RAIN interaction quality over adding more complexity to the other environments.

After implementation verify:

* Home still works
* existing creative flow still works
* TAKE ME SOMEWHERE works
* world selector works
* Tokyo Rain is interactive
* 60-second progress works
* Stay 30 sec More works
* I’M GOOD reaches healthy exit
* mobile touch works
* reduced motion works
* sound remains optional
* production build passes
