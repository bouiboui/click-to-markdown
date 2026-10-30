# Chrome Web Store source notes: Click to Markdown

Last updated: 30 October 2026. Local changes only, with no store submission.

## Store listing

Name: Click to Markdown. Current manifest description: Toggle inspector mode to click any element and copy its content as Markdown.

Draft detailed copy: Click an element or drag an area to copy selected page content as Markdown. Captures include a source link and full link and image URLs. Simple tables use Markdown; merged or nested tables stay as cleaned HTML. Start from the popup or keyboard shortcut. A successful copy ends capture; Escape cancels.

Single purpose: Copy a selected page fragment as useful Markdown. Language: English. Suggested category: Productivity; current dashboard category is unverified.

## Graphics and assets

Existing icons are referenced in src/manifest.json. Screenshot dimensions and dashboard assets have not been reverified. Updated screenshots should demonstrate a sourced fragment and a table before any submission.

## Permissions justification

| Permission | User-facing purpose |
| --- | --- |
| activeTab | Access the selected page after the user starts capture. |
| scripting | Insert the selected-fragment converter into that page. |
| storage | Keep capture activation and popup state aligned. |

No host permission was added.

## Privacy and data use

Selected content is processed locally and copied to the clipboard, including the source URL and title. The changes add no network transmission or analytics. Data is not sold, used for unrelated purposes or used for lending. The public privacy-policy URL and store disclosure answers remain to be verified before release.

## Distribution and developer information

Current store visibility, regions, publisher/contact details and assets were not checked. No private identity is inferred from the local machine.

## Version history

| Source version | Date | Change | Status |
| --- | --- | --- | --- |
| 1.0.4 with local modifications | 2026-10-30 | Source citation, absolute references and faithful table capture. | Not submitted |

## Review notes

Six actual content-script DOM tests and a JavaScript syntax check passed. Actual Chrome reload, popup/highlight/click/drag/auto-disable checks and packaging remain required. Local checks do not establish store availability.
