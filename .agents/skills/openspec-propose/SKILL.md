---
name: openspec-propose
description: Propose a new change with all artifacts generated in one step, including the behavioral test plan. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, tasks, and OpenSpec scenario coverage ready for implementation.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.4.1"
---

Propose a new change - create the change and generate all artifacts in one step.

I'll create a change with artifacts:
- proposal.md (what & why)
- design.md (how)
- tasks.md (implementation steps)
- test-plan.md (OpenSpec scenario coverage and verification gates)

When ready to implement, run /opsx:apply

---

**Input**: The user's request should include a change name (kebab-case) OR a description of what they want to build.

**Steps**

1. **If no clear input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change in the planning home resolved by the CLI with `.openspec.yaml`.

3. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

4. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `resolvedOutputPath`: Resolved path or pattern to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure and write it to `resolvedOutputPath`
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

5. **Create the behavioral test plan companion**

   Create `<changeRoot>/test-plan.md` even if the OpenSpec schema does not list it as a required artifact.

   Build it from `proposal.md`, `design.md`, and delta specs:
   - List every MUST/SHALL scenario from specs in "Scenario coverage".
   - Assign `Risk` from the feature risk and scenario impact: P0 / P1 / P2 / P3.
   - Choose the cheapest sufficient `Test level`: Static, Unit, Component, Integration, E2E, Performance, or Manual.
   - Prefer automation for P0/P1; if automation is not appropriate, require a justified manual check or explicit waiver.
   - Include only behavior-focused tests. Do not add contract tests, visual regression tests, accessibility tests, mutation tests, or feature flag combination matrices as separate directions.
   - Use typed fixtures/factories for API mocks; avoid free-form JSON mocks.

   Use this template:

   ```md
   # Test Plan

   ## Risk level
   P0 / P1 / P2 / P3

   ## Scenario coverage

   | Requirement | Scenario | Risk | Test level | Test file | Status |
   |---|---|---:|---|---|---|

   ## Required automated tests

   ### Unit
   - [ ] ...

   ### Component
   - [ ] ...

   ### Integration
   - [ ] ...

   ### E2E
   - [ ] ...

   ## Manual checks
   - [ ] ...

   ## Test data
   - Fixtures:
   - API mocks:
   - User roles:
   - Seed data:

   ## Out of scope
   - Contract tests
   - Visual regression tests
   - Accessibility tests
   - Mutation tests
   - Feature flag combination matrices

   ## Verification commands
   - [ ] openspec validate <change-name> --strict --no-interactive
   - [ ] frontend: bun run lint / bun run test / bun run build, if affected
   - [ ] backend: npm run lint / npm test / npm run test:e2e, if affected
   - [ ] api: npm run lint / npm run bundle, if API contract changed
   - [ ] E2E smoke / manual exploratory, if required by risk
   ```

6. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- Test plan path and whether all P0/P1 scenarios have planned automated/manual/waiver coverage
- What's ready: "All artifacts created! Ready for implementation."
- Prompt: "Run `/opsx:apply` or ask me to implement to start working on the tasks."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- In `proposal.md`, include `## Quality impact`: risk level, affected routes/components/APIs, required test levels, manual checks, rollback.
- In `design.md`, include `## Test strategy`: static/unit/component/integration/E2E/performance/manual checks mapped to affected layers.
- In `tasks.md`, include implementation tasks, test tasks, `test-plan.md` maintenance, and verification commands.
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output

**Behavioral Testing Rules**

- Main chain: OpenSpec scenario → test level → automated test or justified manual check → CI/verification gate.
- Risk mapping:
  - P0: E2E happy path + key negative path + unit/component tests for complex logic.
  - P1: component/integration tests + one E2E inside a critical journey when justified.
  - P2: unit/component tests.
  - P3: static checks or justified manual check.
- Choose test level by the cheapest layer that observes the behavior:
  - Pure logic → unit.
  - One component behavior → component.
  - Several frontend/backend layers or API mocks/providers → integration.
  - Real browser/session/cookies/middleware/user journey → E2E.
- Required techniques: Given/When/Then, equivalence partitioning, boundary values, state transitions, decision tables, and error guessing where they fit.
- Coverage goal: every MUST/SHALL scenario is automated, manually justified, or explicitly waived; missing P0/P1 coverage blocks the change.
- Out of scope as separate directions: contract tests, visual regression, accessibility tests, mutation tests, feature flag pairwise matrices.

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always create or update `test-plan.md` for changes, even though it is a companion file rather than a schema-required artifact
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
