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
| `background` | `#FFFDF9` | Warm milky cream main canvas background (soothing for moms & babies) |
| `card` | `#FFFFFF` | Crisp white elevated card & modal surface |
| `surfaceSubtle` | `#FFF7EE` | Soft warm peach-cream surface for input fields and subtle section rows |
| `pastelPink` | `#FFF0F3` | Nursery blush pink for baby clothing & primary hero accents |
| `pastelMint` | `#E8FBF8` | Nursery mint green for strollers, cribs & free 0-Xu station badges |
| `pastelButter` | `#FFF9DB` | Sunny duckling yellow for toys & Xu price pills |
| `pastelSky` | `#EBF8FF` | Soft sky blue for children's books & Ehon |
| `pastelLavender` | `#F3F0FF` | Soft lavender for educational items |
| `pastelPeach` | `#FFF4E6` | Warm peach for large toys & activity gear |
| `text` | `#1A1D20` | High-contrast dark charcoal for primary titles and body |
| `textMuted` | `#6C757D` | Medium grey for secondary labels and timestamps |
| `textDim` | `#ADB5BD` | Light grey for placeholder text and disabled states |
| `border` | `rgba(0, 0, 0, 0.08)` | Delicate 1px separator line and card outline |
| `success` | `#2EC4B6` | Mint green for completed exchanges and verified badges |
| `warning` | `#FF9F1C` | Amber for pending requests and dispute notices |
| `error` | `#E63946` | Crimson red for destructive actions and validation errors |
| `coinGold` | `#FFD166` | Amber gold for Kindr Xu balance and reward counters |
| `coinOrange` | `#FF9F1C` | Deep amber for active Xu transactions |
| `coinBackground` | `#FFF8E1` | Soft tint background for Xu badges and reward chips |
| `adminBadge` | `#FFE8E8` | Coral tint background for admin role badges |
| `adminBadgeText` | `#B73232` | High-contrast deep coral for admin badge labels |
| `overlay` | `rgba(0, 0, 0, 0.45)` | Backdrop tint for bottom sheets and action menus |
| `scrim` | `rgba(26, 29, 32, 0.6)` | Dimmed backdrop for critical dialogs and full modals |

### Theme Implementation Note
Kindr standardizes on the unified Warm Light Theme (`COLORS`). All screen components are strictly tokenized using `COLORS` without hardcoded hex literals. Sub-12pt fonts are forbidden across the UI, with exceptions strictly limited to single/double-digit counter bubbles and compact map pin chips.

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
  - `radius-sm`: `8pt` (small badges, tags)
  - `radius-default`: `16pt` (standard components, input fields)
  - `radius-md`: `20pt` (action chips, elevated sheets)
  - `radius-lg`: `28pt` (product cards, modals)
  - `radius-xl`: `40pt` (bottom sheet dialogs, banner corners)
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
