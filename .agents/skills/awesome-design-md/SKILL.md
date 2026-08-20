---
name: awesome-design-md
description: >-
  Standardized living design system specification framework derived from voltagent's awesome-design-md.
  Enforces creating, maintaining, and adhering to a root DESIGN.md capturing tokens, typography,
  component patterns, and theme contracts.
---

# Awesome Design MD: Living Design System Framework

This skill establishes `DESIGN.md` as the single source of truth for all visual and interactive design decisions in the repository, bridging the gap between design specs and code generation.

---

## 1. Role of `DESIGN.md`

`DESIGN.md` resides in the project root and captures:
1. **Core Brand Identity & Metaphor**: Theme personality, target demographic (e.g. parents, kids, community).
2. **Design Tokens**: Hex/RGBA variables for backgrounds, surfaces, text, borders, and brand accents.
3. **Typography Scale**: Font families, weights, sizes, and line-heights.
4. **Elevation & Glassmorphism**: Shadow definitions, border radiuses, and blur treatments.
5. **Component Standards**: Button variants, input styles, modal sheets, cards, and list items.
6. **Mobile Ergonomics**: Safe area insets, minimum tap targets (>= 44pt), haptics.

---

## 2. Synchronization Rules

- **Before implementing UI**: Always consult `DESIGN.md` to pick existing design tokens, components, and layout patterns.
- **When creating new UI components**: Adhere strictly to the spacing scale, border radius tokens, and semantic color names defined in `DESIGN.md`.
- **When evolving the design system**: If a new color token, variant, or typography scale is introduced, update `DESIGN.md` first or simultaneously to keep the documentation synchronized with the codebase.
