# UI/UX Craftsmanship & Design System Rules

This rule defines visual, layout, and ergonomic standards across all mobile screens and web views in Kindr.

---

## 1. Zero Hardcoded Colors & Strict Token Mandate
- **No Static Hex/RGB Literals**: Never hardcode colors like `#ffffff`, `#000000`, or `#ff5252` directly inside component styles.
- **Use Semantic Design Tokens**: Reference `theme.colors` or CSS variables from `DESIGN.md`:
  - `primary` / `secondary` / `accent`
  - `background` / `card` / `surface`
  - `text` / `textMuted` / `textDim`
  - `border` / `borderGlow`
  - `success` / `warning` / `error` / `info`

---

## 2. Anti-Slop Aesthetic & Modern Polish
- **Subtle Depth Over Heavy Shadows**: Use delicate 1px translucent borders (`rgba(255,255,255,0.08)` on dark, `rgba(0,0,0,0.06)` on light).
- **Vector Icons Only**: Always use crisp SVG / Lucide vector icons (`lucide-react-native`). Never use emoji glyphs as primary UI action buttons or markers.
- **Tactile Feedback**: Add smooth active-state scales (`transform: [{ scale: 0.98 }]`) and haptics for critical button taps.
- **Graceful States**: Every screen and list must explicitly support Loading (Skeleton), Empty, and Error states.

---

## 3. Mobile Ergonomics (React Native / Expo)
- **44x44pt Minimum Touch Target**: Buttons, icon triggers, tabs, and checkboxes must have `minHeight: 44` and `minWidth: 44`.
- **Safe Area Insets**: Wrap all screen containers with `SafeAreaView` from `react-native-safe-area-context`.
- **Keyboard Handling**: Wrap forms in `KeyboardAvoidingView` to prevent inputs from being obscured by the on-screen keyboard.

---

## 4. Vietnamese Diacritics & Typography Standards
- **100% Unicode Diacritics Support**: Ensure all typography stacks support Vietnamese accents without font-fallback popping.
- **Font Stack**: Use `'Plus Jakarta Sans', 'Inter', 'Be Vietnam Pro', system-ui, -apple-system, sans-serif`.
