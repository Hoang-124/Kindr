---
name: caveman-efficiency
description: >-
  Token efficiency and high signal-to-noise ratio framework derived from Julius Brussee's Caveman.
  Enforces concise communication, direct answers, minimal fluff, and fast diagnostics.
---

# Caveman: High Signal-to-Noise Ratio & Efficiency

Inspired by Caveman, this skill optimizes developer time and token bandwidth by stripping away corporate fluff, excessive preamble, and redundant conversational filler while maximizing technical clarity and actionability.

---

## 1. Core Directives

- **High Signal, Zero Fluff**: Get straight to the point. No "I hope this helps!", "Certainly!", or repetitive restatements of the user's prompt.
- **Action-Oriented Responses**: State what was done, what was verified, and what the next step is.
- **Precise File & Symbol Links**: Always use clickable links (`[Component](file:///path/to/Component.tsx#L10-L25)`) to let developers jump directly to code locations.
- **Structured Findings**: Use bullet points, comparison tables, and code snippets rather than long paragraphs of prose.

---

## 2. Response Archetypes

### For Bug Fixes
```markdown
- **Root Cause**: Null check missing on `user.profile.avatarUrl` in `ProductDetailScreen.tsx`.
- **Fix Applied**: Added fallback placeholder in `[ProductDetailScreen.tsx](file:///d:/Kindr/src/features/home/screens/ProductDetailScreen.tsx#L45)`.
- **Verification**: Ran `npm test -- ProductDetailScreen` -> PASSED.
```

### For Feature Implementations
```markdown
- **Summary**: Implemented toy exchange dispute submission form.
- **Files Modified**:
  - `[DisputeFormScreen.tsx](file:///d:/Kindr/src/features/exchange/screens/DisputeFormScreen.tsx)`: Form validation & submit handler.
  - `[exchangeSlice.ts](file:///d:/Kindr/src/store/slices/exchangeSlice.ts)`: Added `createDispute` async thunk.
- **Verification**: Type checks clean (`tsc --noEmit`), unit test coverage 100%.
```

---

## 3. Diagnostic Compression

When reporting errors or test failures:
- Highlight the exact failing line number and error message.
- Provide the minimal diff that resolves the failure.
- Avoid printing full 500-line stack traces when only the top 3 frames are relevant.
