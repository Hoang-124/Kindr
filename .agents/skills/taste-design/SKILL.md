---
name: taste-design
description: >-
  Anti-slop UI craftsmanship and aesthetic polish framework derived from Leonxlnx's Taste Skill.
  Enforces refined visual details, subtle borders, intentional whitespace, thoughtful micro-interactions,
  and avoids generic AI styling.
---

# Taste: Anti-Slop UI Craftsmanship & Aesthetic Polish

This skill stops the generation of generic, cookie-cutter "AI slop" interfaces (e.g. garish neon gradients, identical boxed cards, lifeless corporate blues) and enforces bespoke, human-feeling craftsmanship.

---

## 1. The Anti-Slop Principles

```text
❌ Generic AI Slop                  ✅ Taste-Crafted UI
─────────────────────────────────────────────────────────────
• Heavy purple/cyan gradients       • Refined, muted accent tones with depth
• Identical 3-column card grids     • Asymmetric, content-aware layout rhythm
• Random emojis as UI icons         • Pure, consistent vector SVG / Lucide icons
• Generic placeholder lorem ipsum   • Realistic, contextually rich mock data
• Cluttered buttons & borders       • Subtle 1px translucent borders & generous whitespace
• Instant, jarring state snaps      • Fluid micro-transitions (scale, fade, spring)
```

---

## 2. Craftsmanship Rules

### 1. Subtle Borders & Depth Over Heavy Shadows
- Use delicate translucent borders (`rgba(255, 255, 255, 0.08)` on dark, `rgba(0, 0, 0, 0.06)` on light) instead of thick outlines or muddy black drop shadows.
- Layer subtle background opacities to establish visual hierarchy without clutter.

### 2. Typographic Rhythm & Contrast
- Pair display headings with breathable letter-spacing (`letterSpacing: -0.5` for titles, `0` for body).
- Use distinct font weights (e.g., Bold 700 for numbers/prices, Regular 400 for descriptions) to guide the user's eye naturally.

### 3. Tactile Micro-Interactions
- Scale buttons slightly on press (`transform: [{ scale: 0.98 }]`).
- Skeleton loaders should mimic the exact shape and layout of incoming content, not generic grey rectangles.
- Empty states should feel inviting, with warm copy and an immediate single-tap action.

### 4. Color Restraint
- 60-30-10 Rule: 60% neutral background/surface, 30% structural secondary tones, 10% high-impact accent color (e.g., Kindr brand coral/emerald).
- Don't paint every card or badge in primary accent color. Save bold color for calls to action and critical status badges.
