# Gemini Export Bookmarklet

A one-click bookmarklet that exports the Gemini conversation you are viewing to a Markdown file. It runs entirely in your browser: no extension, no account, no server, no network requests.

## Install

1. Show your bookmarks bar (`Ctrl/Cmd + Shift + B`).
2. Either **drag the button** on `index.html` onto the bar, or create a new bookmark and paste the entire contents of [`bookmarklet.min.js`](bookmarklet.min.js) into its URL field.
3. Open a conversation at <https://gemini.google.com> and click the bookmark.

The file downloads as `gemini-chat-YYYY-MM-DD.md`.

Opening `index.html` directly from disk works; the install button reads the bookmarklet out of the page itself, so it does not need a web server.

## Output

```markdown
# Gemini Chat Export
*Exported on: 10/18/2026, 9:14:22 AM*

---

### User
How do I reverse a string in Python?

#### Gemini
Slicing works: `[::-1]`

---
```

Responses keep their text, including fenced code blocks, exactly as the page renders them.

## How it works

The bookmarklet walks the conversation DOM and writes whatever it finds to a `text/markdown` blob, which it hands to a temporary anchor element to trigger the download.

- **Web-component layout** (the current Gemini app): it collects every `user-query` and `model-response` element, pairs them by index, and emits `### User` / `#### Gemini` sections.
- **Container layout**: if no message blocks are found, it falls back to `message-content`, `.conversation-container`, and `.user-query-container` nodes and classifies each one as a user turn or a model turn.

## Limitations

- Exports what the page has rendered. If a turn is missing from the output, scroll the thread until it appears on screen and click the bookmarklet again.
- Text only. Images, attachments, citations, and uploaded files are not included.
- Markdown headings are fixed (`### User`, `#### Gemini`), not configurable.
- The selectors are coupled to Gemini's DOM. When Google renames an element or a class, the export degrades to whatever still matches; the file still downloads with the header intact.

## Development

```sh
npm install
npm test     # node:test + jsdom, covering both extraction layouts
npm run build
```

`npm run build` minifies `bookmarklet.js` into `bookmarklet.min.js` and injects the same string into `index.html` between the `build:bookmarklet` markers. Edit `bookmarklet.js` only, then rebuild.

## License

MIT
