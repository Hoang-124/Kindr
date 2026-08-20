---
name: hermes-agent
description: >-
  Autonomous agency, persistent memory, and self-reflection loops derived from Nous Research's Hermes Agent.
  Enforces structured knowledge accumulation, self-correction, and tool optimization across sessions.
---

# Hermes Agent: Persistent Memory & Autonomous Reflection

Derived from Nous Research's Hermes Agent architecture, this skill enables persistent knowledge accumulation, iterative self-correction, and grounded multi-step reasoning.

---

## 1. Persistent Memory & Knowledge Items

- **Session Knowledge Accumulation**: When discovering critical architectural facts, unique project quirks, or tricky bug workarounds, record them for future reference.
- **Knowledge Item (KI) Structure**:
  - **Context**: The scenario, framework version, or component involved.
  - **Gotcha / Pattern**: The specific behavior or constraint.
  - **Solution / Recipe**: The verified pattern to apply.

---

## 2. The Self-Reflection Loop (Vòng Lặp Tự Phản Tư)

Before finalizing any response or code change:

```text
1. [Intent Check]: Does the implementation completely solve the user's primary goal?
2. [Regression Check]: Could this change break related navigation, store slices, or types?
3. [Assumption Check]: Did I verify the API against active source code rather than hallucinating?
4. [Standard Check]: Does the code adhere to project guidelines (Expo 56, TypeScript, WCAG AA)?
```

If any check fails, iteratively self-correct before presenting the result.

---

## 3. Tool Calling Mastery

- **Batch when possible**: Read and verify files efficiently without redundant round-trips.
- **Inspect Before Mutating**: Always view the target file and surrounding context before applying `replace_file_content` or edits.
- **Verify Execution Directly**: Proactively run tests, linter commands, and builds to confirm correctness.
