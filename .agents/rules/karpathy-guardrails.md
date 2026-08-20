# Karpathy Guardrails for AI Development

This rule enforces Andrej Karpathy's 4 core principles to prevent AI agent hallucinations, scope creep, and code degradation.

---

## 1. Think Before Coding
- **Never guess ambiguous requirements**: If a feature requirement or API signature is unclear, ask clarifying questions or inspect exact definitions.
- **Explicit Assumptions**: State assumptions before writing code.
- **Verify Versioned Docs**: For Expo SDK 56 and React 19, check `https://docs.expo.dev/versions/v56.0.0/` before writing imports or lifecycle code.

---

## 2. Simplicity First
- **Smallest Working Code**: Solve the exact problem with the minimum lines of clean code.
- **No Premature Abstraction**: Do not build speculative frameworks or generic layers for single-instance needs.
- **Native-First**: Prefer standard library and platform-native APIs before considering external npm packages.

---

## 3. Surgical Changes
- **Touch Only What's Needed**: Only modify lines and files directly required for the task.
- **No Unsolicited Reformatting**: Do not reformat or reorganize unrelated files.
- **Preserve Documentation**: Maintain existing comments, type definitions, and naming patterns.
- **Clean Up Orphans**: Delete all temporary console logs, test files, and unused imports.

---

## 4. Goal-Driven Execution
- **Explicit Acceptance Criteria**: Define verifiable success metrics before executing.
- **Automated Verification**: Run TypeScript type checks (`tsc --noEmit`) and automated tests after modifications.
- **Iterate on Failures**: Diagnose errors systematically using root cause analysis instead of random trial-and-error edits.
