# Engineering Standards & Architecture Rules

This rule defines non-negotiable software engineering practices for all code written in this repository.

---

## 🚨 Mandatory Automatic Skill Execution
Agent MUST automatically read, reference, and apply the relevant skills in `.agents/skills/` (using `view_file` to review detailed procedures when needed) for every request without requiring the user to explicitly invoke them.

---

## 1. Test-Driven Development (TDD) & Testing Discipline
- **Mandatory Red-Green-Refactor**: Write failing tests before implementing business logic, Redux slice reducers, or complex utility functions.
- **Unit & Integration Coverage**: Ensure state transitions, async thunks, and validation schemas are backed by automated tests.
- **Zero Broken Tests**: Never leave the repository with failing tests.

---

## 2. Strict TypeScript & Type Safety
- **No `any` or loose casts**: Use discriminated unions, generics, or Zod schemas.
- **Strict Null Checks**: Always handle `undefined` and `null` gracefully, especially for user profiles, image URLs, and network responses.
- **Exported Type Contracts**: Types must be placed in `src/types/` and kept cleanly decoupled from UI components.

---

## 3. The Laziness Ladder & Minimal Code
- **1st Choice**: Use built-in React Native / Expo 56 standard components and APIs.
- **2nd Choice**: Use existing shared components in `src/components/`.
- **3rd Choice**: Write concise, focused custom helpers.
- **Avoid Over-Engineering**: Do not write speculative abstraction layers or generic utility classes for single-use scenarios.

---

## 4. Multi-Lens Self-Review Prior to Completion
Always run a 4-lens review pass:
1. **Product / UX (CEO Lens)**: Does this provide a clean, delightful experience for parents and children using Kindr?
2. **Architecture (Tech Lead Lens)**: Is state cleanly managed via Redux Toolkit slices? Are components modular and readable?
3. **QA & Edge Cases (QA Lead Lens)**: Are network errors, empty states, and invalid inputs gracefully handled?
4. **Security (Security Officer Lens)**: Are auth tokens, personal data, and image uploads securely processed and stored?
