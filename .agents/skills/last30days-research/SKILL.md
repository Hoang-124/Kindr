---
name: last30days-research
description: >-
  Grounded real-time research and fact-checking framework derived from mvanhorn's last30days-skill.
  Enforces looking up active documentation, checking recent package releases (Expo v56, React 19, React Native 0.85),
  and eliminating obsolete API hallucinations.
---

# Last30Days: Grounded Real-Time Research & Doc Verification

This skill prevents AI agents from generating outdated or deprecated code by establishing strict rules for researching active library APIs, breaking changes, and community best practices.

---

## 1. The Real-Time Research Mandate

AI training data often trails behind fast-moving ecosystems. For frameworks undergoing major overhauls (such as Expo SDK 56, React 19 Server/Async APIs, and React Native New Architecture):

```text
⚠️ NEVER rely on outdated training memory for new major framework versions.
✅ ALWAYS verify APIs against versioned documentation or local package source types.
```

---

## 2. Research Protocol for Modern React Native & Expo

When writing code involving Expo or React Native:
1. **Check Local Installed Versions**: Inspect `package.json` and `node_modules/<pkg>/package.json` to know the exact installed version (e.g., `expo: ~56.0.8`, `react: 19.2.3`, `react-native: 0.85.3`).
2. **Consult Official Versioned Docs**:
   - Expo SDK 56: `https://docs.expo.dev/versions/v56.0.0/`
   - React 19 APIs: `useActionState`, `useOptimistic`, async transitions.
   - React Navigation v7: `https://reactnavigation.org/docs/`
3. **Verify Deprecations**:
   - For example: Legacy `expo-permissions` is deprecated in favor of modular permissions (e.g., `expo-camera`, `expo-image-picker`).
   - `AsyncStorage` should be imported from `@react-native-async-storage/async-storage`.

---

## 3. Search & Synthesis Best Practices

When querying web search or documentation:
- Include the exact version string in search queries (e.g., `"expo 56" "expo-router" navigation`).
- Synthesize actionable code patterns with direct citations.
- Confirm type signatures in `node_modules/@types/` or `.d.ts` before committing edits.
