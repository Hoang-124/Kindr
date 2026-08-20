---
name: karpathy-guidelines
description: >-
  Andrej Karpathy's core engineering principles for AI coding agents.
  Enforces Think Before Coding, Simplicity First, Surgical Changes, and Goal-Driven Execution.
---

# Andrej Karpathy's LLM Coding Guardrails

Derived from Andrej Karpathy's insights on common LLM coding pitfalls, this skill enforces four non-negotiable operational principles.

---

## The 4 Core Principles

### 1. Think Before Coding (Tránh Giả Định Ngầm)
- **Clarify ambiguities first**: If a requirement or API is underspecified, stop and ask clarifying questions instead of guessing.
- **State assumptions explicitly**: Before writing any logic, outline the expected inputs, edge cases, and assumptions.
- **Check existing patterns**: Inspect the project architecture and existing implementations before designing new abstractions.

### 2. Simplicity First (Đơn Giản Là Trên Hết)
- **Minimum viable code**: Write the smallest amount of code required to solve the exact problem.
- **Avoid premature abstraction**: Do not introduce generic helper classes, complex design patterns, or extra abstraction layers for hypothetical future requirements.
- **Reject unnecessary dependencies**: Use standard library and built-in platform capabilities before reaching for external packages.

### 3. Surgical Changes (Chỉnh Sửa Đúng Chỗ, Không Phá Vỡ Xung Quanh)
- **Touch only necessary lines**: Limit modifications strictly to the files and functions directly related to the task.
- **No unsolicited refactoring**: Do not reformat, rename, or rearchitect unrelated files while implementing a feature or bugfix.
- **Preserve existing style and comments**: Maintain existing naming conventions, formatting rules, and documentation comments.
- **Clean up artifacts**: Remove temporary logs, test files, and unused imports introduced during development.

### 4. Goal-Driven Execution (Lặp Cho Đến Khi Đạt Mục Tiêu)
- **Define explicit acceptance criteria**: Determine what "done" means before executing (e.g., specific test passing, screen rendering correctly, zero TypeScript errors).
- **Verify automatically**: Run linters, type checks (`tsc --noEmit`), and automated tests to validate changes.
- **Self-correct through feedback loops**: When an error occurs, inspect the exact error message, diagnose the root cause systematically, and fix it directly rather than trying random variations.

---

## Anti-Pattern Checklist

| Anti-Pattern | Karpathy Remedy |
| :--- | :--- |
| **Vibe coding without tests** | Define measurable success criteria and verify with automated checks. |
| **Over-engineering a simple task** | Follow the Laziness Ladder: pick the simplest native solution. |
| **Modifying 10 unrelated files** | Keep diffs surgical; only modify lines directly serving the task. |
| **Guessing API arguments** | Read exact documentation or inspect source definitions first. |
