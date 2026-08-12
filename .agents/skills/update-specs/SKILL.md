---
name: update-specs
description: "Update specification documents from Confluence. Use when: need to refresh specs, download new requirements from Confluence, export Confluence pages to docx and convert to markdown, sync spec documents."
argument-hint: "Optionally specify a project folder name (e.g. LKvuzov) to update only that project"
---

# Update Specs from Confluence

Export Confluence pages to docx via K15t Scroll Word Exporter and convert them to markdown for agent-searchable requirements.

## Prerequisites

- Node.js 18+
- Dependencies installed in skill folder: `npm ci --prefix .agents/skills/update-specs/scripts`
- Chromium for Playwright: `npx --prefix .agents/skills/update-specs/scripts playwright install chromium`
- `pandoc` installed (for docx → md conversion)
- spec folder in `apps/e2e/` path

## Procedure

1. Read `spec/list.md` to get the list of Confluence URLs and their target folders . If the file is missing or empty, prompt the user to create it.
2. Parse the table: extract document name and URL for each row; `## headers` define the target folder
3. If user specified a project folder, filter to only that folder's documents
4. Run the export script:

```bash
   npx --prefix .agents/skills/update-specs/scripts tsx .agents/skills/update-specs/scripts/export_confluence.ts --list spec/list.md --downloads spec/.docx/
```

Optional flags:

- `--folder LKvuzov` — export only documents under the `## LKvuzov` section
- `--auth-state .confluence_auth.json` — path to cached auth state (default)

How the script works:

- Opens a visible Chromium browser (`headless: false`)
- On first run or expired session: user must complete 2FA manually in the browser window
- The script waits for authentication (URL changes away from `/login`), then proceeds automatically
- Auth state is saved to `.confluence_auth.json` for reuse
- For each document:
  1. Navigates to the Confluence page
  2. Opens "More options" menu (`#action-menu-link`)
  3. Clicks "Export to Word" (`#k15t-exp-word-export-dialog-web-item`) — K15t Scroll Word Exporter plugin
  4. Clicks "Export" button inside the iframe dialog
  5. Polls for the "click here to download" link (up to 2 minutes)
  6. Downloads the generated docx file
- Downloaded docx files are saved to `spec/.docx/` folder

5. Convert docx to markdown using pandoc:

```bash
   for f in spec/.docx/*.docx; do
     name=$(basename "$f" .docx)
     folder=$(grep -F "$name" spec/list.md | head -1 | sed 's/.*##\s*//' || echo "unknown")
     mkdir -p "spec/$folder"
     pandoc "$f" -t markdown -o "spec/$folder/${name}.docx.md" --wrap=none
   done
```

6. Report which documents were updated and any errors

7. Clean up downloaded docx files: `rm spec/.docx/*.docx`

## Notes

- Auth state is cached in `.confluence_auth.json` (gitignored). Delete it to force re-authentication.
- The `spec/.docx/` folder stores intermediate docx files (hidden folder, gitignored).
- Existing md files in `spec/` subfolders are overwritten on update.
- The export uses K15t Scroll Word Exporter plugin selectors — if the plugin changes, update the selectors in the script.
