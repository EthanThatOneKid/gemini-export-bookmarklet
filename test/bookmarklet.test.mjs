import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(join(root, "bookmarklet.js"), "utf8");

// jsdom does not implement innerText; the bookmarklet relies on it, so proxy it to textContent.
function run(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    runScripts: "outside-only",
  });
  const { window } = dom;

  Object.defineProperty(window.HTMLElement.prototype, "innerText", {
    configurable: true,
    get() {
      return this.textContent;
    },
  });

  let markdown = null;
  let download = null;

  window.Blob = class {
    constructor(parts) {
      markdown = parts.join("");
    }
  };
  window.URL.createObjectURL = () => "blob:captured";
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function () {
    download = this.download;
  };

  window.eval(source);

  return { markdown, download };
}

test("extracts turns from the current Gemini web-component layout", () => {
  const { markdown } = run(`
    <user-query>How do I reverse a string in Python?</user-query>
    <model-response>Slicing works: [::-1]</model-response>
    <user-query>And in JavaScript?</user-query>
    <model-response>Split, reverse, join.</model-response>
  `);

  assert.match(markdown, /^# Gemini Chat Export\n\*Exported on: .+\*\n\n---\n\n/);
  assert.match(markdown, /### User\nHow do I reverse a string in Python\?/);
  assert.match(markdown, /#### Gemini\nSlicing works: \[::-1\]/);
  assert.match(markdown, /### User\nAnd in JavaScript\?/);
  assert.match(markdown, /#### Gemini\nSplit, reverse, join\./);
  assert.ok(markdown.indexOf("How do I reverse") < markdown.indexOf("Slicing works"));
});

test("extracts turns from conversation-container blocks in document order", () => {
  const { markdown } = run(`
    <div class="user-query-container">What is a bookmarklet?</div>
    <div class="conversation-container">A bookmark whose URL is JavaScript.</div>
  `);

  assert.match(markdown, /### User\nWhat is a bookmarklet\?/);
  assert.match(markdown, /#### Gemini\nA bookmark whose URL is JavaScript\./);
});

test("names the download with the export date", () => {
  const { download } = run(`<user-query>hi</user-query><model-response>hello</model-response>`);
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(download, `gemini-chat-${today}.md`);
});

test("still emits the header when the page has no recognizable turns", () => {
  const { markdown, download } = run(`<div>Loading conversation...</div>`);
  assert.match(markdown, /^# Gemini Chat Export/);
  assert.equal(typeof download, "string");
});

test("preserves fenced code blocks printed inside a response", () => {
  const { markdown } = run(`
    <user-query>Show me the snippet</user-query>
    <model-response>Try this:
\`\`\`js
const x = 1;
\`\`\`</model-response>
  `);

  assert.match(markdown, /```js\nconst x = 1;\n```/);
});
