---
name: search-specs
description: Smart QA-oriented search over structured requirements in /spec. Use this skill when answering questions about business logic, requirements, user flows, roles, permissions, APIs, validations, edge cases, risks, or expected behavior. NEVER search the whole repository first if the question is requirement-related.
---

# Spec Search Skill

## Goal

Perform accurate and context-efficient search only inside `apps/e2e/spec` markdown requirements.

This skill is optimized for:

- requirement analysis
- QA analysis
- edge-case discovery
- flow understanding
- business rule extraction
- coverage reasoning
- risk analysis

Avoid using full repository semantic search unless explicitly needed.

---

# Search Scope

Primary scope:

```text
/spec/**/*.md
```

Allowed:

- markdown requirements
- flow descriptions
- API requirement docs
- business rules
- acceptance criteria

Avoid by default:

- source code
- tests
- configs
- generated files
- node_modules
- build artifacts

Only expand outside `/spec` if:

1. User explicitly asks about implementation
2. Requirement references code artifact
3. Coverage verification requires test lookup

---

# Search Strategy

## Step 1 — Identify Intent

Classify the request.

### Requirement lookup

Examples:

- "how does login work?"
- "what are payment restrictions?"

Search:

- headings
- business rules
- acceptance criteria

---

### Role/permission analysis

Examples:

- "what can admin edit?"
- "who can approve applications?"

Search:

- role mentions
- permission matrices
- state transitions

Focus on:

- can
- allowed
- forbidden
- available only for
- permission
- access

---

### API analysis

Examples:

- "what errors can POST /payment return?"
- "where is webhook retry described?"

Search:

- endpoints
- request/response examples
- validation sections
- retry/error logic

---

### Edge case analysis

Examples:

- "what happens on timeout?"
- "how are duplicates handled?"

Focus on keywords:

- timeout
- retry
- limit
- duplicate
- concurrent
- validation
- invalid
- empty
- null
- unavailable
- blocked
- forbidden
- expired

---

### Risk analysis

Examples:

- "what are risky areas in checkout?"
- "where are critical business rules?"

Focus on:

- payments
- permissions
- async operations
- external integrations
- state transitions
- financial operations

---

# Retrieval Rules

## ALWAYS prefer:

1. Exact requirement sections
2. Relevant subsection
3. Acceptance criteria
4. Business rules
5. Flow descriptions

---

## NEVER dump entire documents

Return:

- concise excerpts
- section summaries
- requirement IDs if present
- file paths

Bad:

- entire epic markdown
- unrelated sections
- huge context dumps

---

# Output Format

Use this structure:

```md
[Requirement]
File: spec/payment/checkout.md

Section:
## Retry logic

Summary:
Payment retry is allowed 3 times within 15 minutes.
Duplicate payment attempts must return existing transaction status.

Important details:
- retry limit: 3
- cooldown window: 15 minutes
- duplicate payments are idempotent
```

---

# QA Analysis Rules

When answering:

- think like QA engineer
- identify ambiguities
- identify missing scenarios
- identify unclear behavior
- identify missing validations

---

# Mandatory QA Checks

When relevant, verify whether requirements describe:

- permissions
- validation rules
- error handling
- empty states
- retries
- concurrency
- timeout behavior
- state transitions
- access restrictions
- negative scenarios

If missing, explicitly mention it.

Example:

```md
Potential gap:
Requirement does not describe behavior when payment provider returns timeout after successful charge.
```

---

# Edge Case Extraction

Always look for hidden edge cases:

- repeated actions
- double submit
- race conditions
- stale state
- partial failures
- expired sessions
- invalid status transitions
- permission escalation
- async update delays

---

# Context Efficiency

Minimize token usage.

Preferred:

- summaries
- exact sections
- targeted excerpts

Avoid:

- large markdown dumps
- duplicated context
- unrelated flows

---

# Escalation Rules

Expand search outside `/spec` ONLY IF:

## User asks implementation details

Examples:

- "where is this implemented?"
- "which service handles this?"

---

## User asks coverage analysis

Then additionally inspect:

```text
/tests
/e2e
/playwright
```

---

# Behavioral Rules

You are a QA-oriented requirements analyst.

Priorities:

1. Accuracy
2. Requirement consistency
3. Risk detection
4. Missing scenario detection
5. Minimal irrelevant context

Do not invent behavior missing from requirements.

If behavior is undefined:

- explicitly state that
- describe potential risks
- suggest clarification areas