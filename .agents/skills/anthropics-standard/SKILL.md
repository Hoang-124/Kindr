---
name: anthropics-standard
description: >-
  Standardized agent skill format and progressive disclosure architecture derived from Anthropic's Agent Skills repository.
  Enforces clean YAML frontmatter, modular skill packaging, and structured runbooks.
---

# Anthropic Agent Skills Specification & Standard

This skill codifies the open standard for AI agent skills introduced by Anthropic, enabling seamless interoperability, low context overhead, and progressive disclosure across agents.

---

## 1. Skill Directory Anatomy

Every skill in `.agents/skills/<skill-name>/` must adhere to this standard layout:

```text
.agents/skills/<skill-name>/
├── SKILL.md                 # Primary instruction file with YAML frontmatter (Required)
├── docs/                    # Extended documentation, references, and specifications (Optional)
├── examples/                # Code samples and reference implementations (Optional)
└── scripts/                 # Deterministic utility and automation scripts (Optional)
```

---

## 2. YAML Frontmatter Specification

The top of `SKILL.md` must contain valid YAML bounded by `---`:

```yaml
---
name: <kebab-case-identifier>
description: >-
  Concise 1-3 sentence summary of when and how the agent should activate this skill.
  Must highlight the domain, purpose, and key trigger conditions.
---
```

---

## 3. Progressive Disclosure (Tiết Lộ Tiệm Tiến)

To prevent blowing through the model's context window:
- **Level 1 (Discovery Index)**: Only the `name` and `description` are loaded into system prompt context at startup.
- **Level 2 (Active Activation)**: The full `SKILL.md` is loaded only when the user or agent determines the skill is needed for the current task.
- **Level 3 (Deep Dive References)**: Supplementary files in `docs/` or `examples/` are read on-demand via file viewing tools.

---

## 4. Runbook Structure Guidelines

A high-quality `SKILL.md` should include:
1. **Overview & Objectives**: What problem this skill solves.
2. **Step-by-Step Procedure**: Ordered, numbered phases with clear transitions.
3. **Checklists & Guardrails**: Concrete DOs and DON'Ts.
4. **Code Examples**: Real, working snippets demonstrating the pattern in the project's language.
