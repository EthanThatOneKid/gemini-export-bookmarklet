import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "terser";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(join(root, "bookmarklet.js"), "utf8");
const { code } = await minify(source, { compress: true, mangle: true });

if (!code) {
  throw new Error("terser produced no output");
}

const bookmarklet = "javascript:" + code;
await writeFile(join(root, "bookmarklet.min.js"), bookmarklet + "\n");

const start = "<!-- build:bookmarklet:start -->";
const end = "<!-- build:bookmarklet:end -->";
const pagePath = join(root, "index.html");
const page = await readFile(pagePath, "utf8");
const startIndex = page.indexOf(start);
const endIndex = page.indexOf(end);

if (startIndex === -1 || endIndex === -1) {
  throw new Error(`index.html is missing the ${start} / ${end} markers`);
}

const block =
  start + "\n    " + `<script type="text/plain" id="bookmarklet">${bookmarklet}</script>` + "\n    " + end;
await writeFile(pagePath, page.slice(0, startIndex) + block + page.slice(endIndex + end.length));

console.log(`bookmarklet.min.js: ${bookmarklet.length} characters`);
console.log(`index.html: bookmarklet injected`);
