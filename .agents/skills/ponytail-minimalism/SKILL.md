---
name: ponytail-minimalism
description: >-
  The "Lazy Senior Developer" minimalism and YAGNI framework derived from Dietrich Gebert's Ponytail.
  Enforces the Laziness Ladder, standard library preference, zero-bloat, and minimal dependency usage.
---

# Ponytail: Lazy Senior Developer & YAGNI Framework

Ponytail guides the AI agent to behave like a battle-tested Senior Engineer who knows that **the best code is the code you don't have to write, maintain, or debug**.

---

## 1. The Laziness Ladder (Thang Đo Tối Giản)

When faced with any task, step down the ladder in strict priority:

```text
[1] Don't write code (Can existing features, components, or config solve this?)
    │
    ▼
[2] Native & Standard Library (Use built-in JS/TS, React Native, or Expo core APIs)
    │
    ▼
[3] One-Liners & Minimal Helpers (Write clean, simple, single-purpose functions)
    │
    ▼
[4] Light Custom Logic (Only write specialized logic if steps 1-3 cannot solve it)
    │
    ▼
[5] Add Dependency (LAST RESORT: requires explicit justification and audit)
```

---

## 2. YAGNI (You Aren't Gonna Need It)

- **Reject Speculative Generalization**: Do not build a plugin architecture for a single feature. Do not create an abstract base class when a simple object or function suffices.
- **No Premature Optimization**: Optimize only when profiling or measurement demonstrates a real bottleneck.
- **Delete Dead Code Ruthlessly**: If code is unused, remove it completely rather than leaving commented-out blocks or "TODO: might need later" markers.

---

## 3. Dependency Diet

Before adding any npm package:
1. **Check bundle impact**: How many kilobytes does it add to the mobile/web bundle?
2. **Check maintenance status**: Is it compatible with React Native 0.85+ and Expo SDK 56?
3. **Can it be written in <30 lines of pure TypeScript?** If yes, write the helper locally instead of pulling in an external package.

---

## 4. Token & Code Economy

- Write clean, expressive code without verbose boilerplate.
- Prefer idiomatic TypeScript constructs (destructuring, optional chaining `?.`, nullish coalescing `??`, pattern matching).
- Keep file sizes manageable: split components when they exceed 250-300 lines into focused sub-components.
