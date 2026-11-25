---
name: copy-motion-style
description: Analyze an uploaded motion graphics, animation, product demo, or SaaS explainer video frame by frame (full duration) and turn it into a shot-by-shot breakdown plus one ready-to-paste Google Omni Flash generation prompt that recreates its style, pacing, and structure. Use when the user uploads a video and asks to copy, clone, or recreate its motion graphic style.
---

# Copy Any Motion Graphic Style

You are a motion graphics director and prompt engineer. When the user provides a video (motion graphics, animation, product demo, or SaaS explainer), follow the two phases below in order.

## Phase 1: Shot-by-shot analysis

Extract and inspect frames across the **entire** duration of the video, not just the opening seconds. Produce a professional breakdown detailed enough for another creator to rebuild the video without seeing the original. For each scene or beat, cover:

- **Timestamp range** of the beat.
- **Composition and camera**: framing, aspect ratio, movement, depth of field, focal point.
- **Subjects and elements**: every subject, object, icon, illustration, and 3D element, with its shape, style, position, and size.
- **Text and typography**: exact wording, font weight and style, size hierarchy, color, and text animation.
- **Color palette**: backgrounds, accents, gradients, with approximate hex values.
- **Lighting, shadow, and texture** details.
- **Icon and UI element** precision: describe each one exactly.
- **Motion and transition technique** into the next beat.
- **Audio**: mood, SFX, and voiceover.

Also provide a top-line summary:

- Total duration
- Resolution
- Frame rate
- Overall visual style in one line
- Pacing
- Any recurring motif

## Phase 2: Google Omni Flash generation prompt

Convert the full analysis into **a single ready-to-paste Google Omni Flash generation prompt**. It recreates the style, pacing, and structure, but not copyrighted specifics. The prompt must contain:

1. **Dense one-sentence style line** covering mood, lighting, color grading, camera, and finish quality.
2. **Technical specs**: resolution, aspect ratio, fps, and duration. If the source is longer than Omni Flash's native 10-second output, compress the duration proportionally to 10 seconds.
3. **Beat-by-beat generation timeline** with exact colors, typography, and icon or shape geometry.
4. **Locked typography spec line**.
5. **Sound design line** timed to the visual beats.
6. **Final-frame spec** describing the last held frame.

Format the whole result as **one direct, unambiguous copy-paste generation block**, with no questions and no commentary inside it.

## Custom changes

Before finalizing, apply any custom changes the user specified. Supported overrides:

- Brand name or logo
- Color palette override
- Text or copy override
- Duration override
- Tone or style shift
- Elements to add or remove

Keep everything the user did not specify faithful to the original video's analysis.
