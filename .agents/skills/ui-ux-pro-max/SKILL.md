---
name: ui-ux-pro-max
description: >-
  Comprehensive UI/UX design intelligence and design system engineering derived from UI/UX Pro Max.
  Enforces color theory, typography hierarchy, mobile touch ergonomics, accessibility (WCAG AA),
  and seamless dark/light theme tokens for React Native and Web.
---

# UI/UX Pro Max: Design Intelligence & System Engineering

This skill provides an automated "design brain trust" to create cohesive, modern, and accessible user interfaces for both mobile (Expo / React Native) and web applications.

---

## 1. Design Tokens & Color Harmony

- **Never Hardcode Static Colors**: Use semantic design tokens for text, backgrounds, borders, and status indicators.
- **Harmonious Palettes**:
  - **Primary Brand**: Playful yet refined coral/teal/amber palette suited for family/kids toy exchange.
  - **Semantic States**: Success (Emerald/Green), Warning (Amber), Error (Rose/Red), Info (Sky/Blue).
  - **Neutrals**: Warm greys or slate tones that contrast naturally in both light and dark modes.
- **Contrast Ratios**: Maintain minimum WCAG AA contrast (4.5:1 for normal text, 3:1 for large text and interactive components).

---

## 2. Typography & Hierarchy

- **Type Scale**:
  - `Display / H1`: 28–32pt, Bold (700), Line height 1.2
  - `Title / H2`: 22–24pt, SemiBold (600), Line height 1.25
  - `Headline / H3`: 18–20pt, SemiBold (600), Line height 1.3
  - `Body / Regular`: 15–16pt, Regular (400), Line height 1.45
  - `Caption / Subtext`: 12–13pt, Medium (500), Line height 1.4
- **Vietnamese Diacritics Support**: Ensure font stack cleanly renders Vietnamese diacritics without font-fallback jitter or clipping.

---

## 3. Mobile Touch Ergonomics (React Native / Expo)

- **Minimum Touch Targets**: All buttons, icon triggers, tabs, and interactive chips must be at least **44x44pt** (`minHeight: 44`, `minWidth: 44`).
- **Safe Area Insets**: Always wrap screens with `react-native-safe-area-context` to account for notches, dynamic islands, and home indicator bars.
- **Keyboard Handling**: Use `KeyboardAvoidingView` / `react-native-keyboard-controller` and dismissible scroll views to prevent input occlusion.
- **Haptic Feedback**: Provide subtle tactile feedback on key actions (success, tap, pull-to-refresh).

---

## 4. Layout, Spacing & Micro-Interactions

- **8pt Grid System**: Use consistent spacing increments (`4`, `8`, `12`, `16`, `24`, `32`, `48`pt).
- **Glassmorphism & Elevation**:
  - Subtle frosted glass backgrounds with border strokes (1px rgba/hsl) in dark mode.
  - Soft multi-layered ambient drop shadows in light mode.
- **State Feedback**: Always design explicit visual states:
  - Default
  - Pressed / Active (opacity / scale 0.98)
  - Focused (outline / border highlight)
  - Loading (Skeleton shimmer or spinner)
  - Empty State (contextual illustration + clear CTA)
  - Error State (inline validation message + recovery button)
