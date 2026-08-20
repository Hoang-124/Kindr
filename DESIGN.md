# Kindr Living Design System (DESIGN.md)

This document is the single source of truth for all visual design tokens, component specifications, and interaction patterns across the Kindr mobile app (Expo / React Native) and web pitch pages.

---

## 1. Brand Identity & Personality

Kindr connects families to exchange gently used toys, educational games, and books—fostering community sharing, decluttering homes, and promoting sustainability.

- **Keywords**: Warm, Joyful, Trustworthy, Modern, Sustainable, Child-Safe.
- **Visual Mood**: Soft rounded geometry, warm ambient palettes, subtle frosted glass surfaces, and tactile micro-interactions.

---

## 2. Color Tokens & Semantic Palette

### Light Mode (`[data-theme="light"]`)
| Token Name | Hex / Value | Description & Usage |
| :--- | :--- | :--- |
| `primary` | `#FF6B6B` | Vibrant coral — primary buttons, active highlights, key CTAs |
| `primaryDark` | `#E05353` | Darker coral for active/pressed states |
| `primaryLight` | `#FFE8E8` | Soft pastel tint for badge backgrounds and active pills |
| `secondary` | `#4ECDC4` | Energetic teal — secondary actions, category tags, filters |
| `accent` | `#FFD166` | Warm sunny yellow — ratings, reward badges, sparkles |
| `background` | `#F8F9FA` | Warm off-white main canvas background |
| `card` | `#FFFFFF` | Crisp white elevated card & modal surface |
| `surfaceSubtle` | `#F1F3F5` | Secondary surface for input fields and subtle section rows |
| `text` | `#1A1D20` | High-contrast dark charcoal for primary titles and body |
| `textMuted` | `#6C757D` | Medium grey for secondary labels and timestamps |
| `textDim` | `#ADB5BD` | Light grey for placeholder text and disabled states |
| `border` | `rgba(0, 0, 0, 0.08)` | Delicate 1px separator line and card outline |
| `success` | `#2EC4B6` | Mint green for completed exchanges and verified badges |
| `warning` | `#FF9F1C` | Amber for pending requests and dispute notices |
| `error` | `#E63946` | Crimson red for destructive actions and validation errors |

### Dark Mode (`[data-theme="dark"]`)
| Token Name | Hex / Value | Description & Usage |
| :--- | :--- | :--- |
| `primary` | `#FF7B7B` | Slightly brighter coral for dark background contrast |
| `secondary` | `#5FE0D7` | Luminous teal for secondary accents |
| `accent` | `#FFE082` | Soft warm gold for star ratings and badges |
| `background` | `#0F141C` | Deep navy-slate main background |
| `card` | `#18202C` | Elevated slate surface with subtle translucent tint |
| `surfaceSubtle` | `#222C3C` | Input backgrounds and pill chips |
| `text` | `#F8F9FA` | Crisp light text for readability |
| `textMuted` | `#94A3B8` | Slate grey for secondary captions |
| `textDim` | `#64748B` | Muted slate for placeholders |
| `border` | `rgba(255, 255, 255, 0.08)` | 1px luminous outline for dark glassmorphic cards |
| `success` | `#34D399` | Emerald green status badge |
| `warning` | `#FBBF24` | Warm amber status badge |
| `error` | `#F87171` | Soft coral-red for errors |

---

## 3. Typography Scale & Hierarchy

- **Font Family**: `'Plus Jakarta Sans', 'Inter', 'Be Vietnam Pro', system-ui, -apple-system, sans-serif`
- **Vietnamese Unicode**: Must fully render diacritics without font-fallback glitching.

| Style Name | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Display / H1` | `28pt` | Bold (700) | `34pt` | `-0.5pt` | Onboarding titles, hero headers |
| `Title / H2` | `22pt` | SemiBold (600) | `28pt` | `-0.3pt` | Section headers, screen titles |
| `Headline / H3` | `18pt` | SemiBold (600) | `24pt` | `0pt` | Card titles, modal headers |
| `Body Large` | `16pt` | Regular (400) | `22pt` | `0pt` | Primary body copy, inputs |
| `Body / Regular`| `14pt` | Regular (400) | `20pt` | `0pt` | Secondary body, description |
| `Caption / Label`| `12pt` | Medium (500) | `16pt` | `+0.2pt` | Badges, timestamps, small tags |

---

## 4. Spacing & Border Radius Tokens

- **Spacing Base**: 4pt / 8pt grid (`4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`pt).
- **Border Radius**:
  - `radius-sm`: `6pt` (small badges, tags)
  - `radius-md`: `12pt` (input fields, action chips)
  - `radius-lg`: `18pt` (product cards, modals)
  - `radius-xl`: `24pt` (bottom sheet dialogs)
  - `radius-full`: `9999pt` (pill buttons, circular avatars)

---

## 5. Component Patterns & Ergonomics

### 1. Buttons & Touchable Triggers
- **Touch Target**: Minimum height `44pt` (`minHeight: 44`, `minWidth: 44`).
- **Variants**:
  - `Primary`: Solid coral background, white text, bold font, rounded-full or radius-md.
  - `Secondary`: Outlined with 1px border or subtle teal/slate tint.
  - `Ghost`: Icon only or transparent background with muted text.
- **Active State**: Micro-scale `transform: [{ scale: 0.98 }]` with subtle opacity drop to `0.9`.

### 2. Form Inputs
- **Height**: Minimum `48pt` with generous horizontal padding (`16pt`).
- **States**: Clear border highlight on focus (`color: primary`), inline validation error messages with icons.

### 3. Cards & Lists
- **Item Cards**: Frosted or elevated card with 1px border stroke, soft shadow, item thumbnail with 1:1 or 4:3 aspect ratio, title, distance tag, and condition badge.

### 4. Screen Layout & Safe Areas
- Always wrap screen roots with `SafeAreaView` (edges `['top', 'bottom']`).
- Use `KeyboardAvoidingView` on iOS with behavior `padding` and offset adjustments.
