const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "miniprogram");
const wxssFiles = [];
let importantCount = 0;
const longClassViolations = [];
const longFileViolations = [];
const nestedViolations = [];
const nestedAllowlist = new Set([
  path.join(root, "styles/shared-secondary.wxss"),
  path.join(root, "styles/components.wxss"),
  path.join(root, "styles/form-base.wxss"),
  path.join(root, "styles/tab/profile-dashboard.wxss"),
  path.join(root, "styles/tab/notes-memo.wxss"),
  path.join(root, "styles/tab/stats-ledger.wxss"),
  path.join(root, "pages/profile-edit/profile-edit.wxss"),
  path.join(root, "pages/stats/stats.wxss"),
  path.join(root, "pages/checklist/checklist.wxss"),
]);

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!name.endsWith(".wxss")) continue;
    wxssFiles.push(fullPath);
  }
}

function countSegments(className) {
  return className.split("-").length;
}

function findNestedSelectors(content, file) {
  const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = withoutComments.split("}");
  blocks.forEach((block) => {
    const selectorPart = block.split("{")[0];
    if (!selectorPart) return;
    selectorPart.split(",").forEach((selector) => {
      const trimmed = selector.trim();
      if (!trimmed || trimmed.startsWith("@")) return;
      if (/\.[a-z][\w-]*\s+\.[a-z][\w-]*/.test(trimmed)) {
        nestedViolations.push(`${path.relative(root, file)}: ${trimmed}`);
      }
    });
  });
}

walk(root);

for (const file of wxssFiles) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  importantCount += (content.match(/!important/g) || []).length;
  if (lines.length > 800) {
    longFileViolations.push(`${path.relative(root, file)} (${lines.length} lines)`);
  }
  const classMatches = content.match(/\.([a-z][a-z0-9-]+)/g) || [];
  classMatches.forEach((token) => {
    const className = token.slice(1);
    if (countSegments(className) > 3) {
      longClassViolations.push(`${path.relative(root, file)}: .${className}`);
    }
  });
  if (!nestedAllowlist.has(file)) {
    findNestedSelectors(content, file);
  }
}

console.log(`WXSS files: ${wxssFiles.length}`);
console.log(`!important count: ${importantCount}`);
if (importantCount > 0) {
  console.warn("!important should stay at 0; remove any new occurrences.");
}
if (longFileViolations.length) {
  console.warn("Files over 800 lines:");
  longFileViolations.forEach((item) => console.warn(`- ${item}`));
}
if (nestedViolations.length) {
  console.warn(`Nested class selectors (${nestedViolations.length}, allowlist migration pending):`);
  [...new Set(nestedViolations)].slice(0, 8).forEach((item) => console.warn(`- ${item}`));
  if (nestedViolations.length > 8) {
    console.warn(`- ... and ${nestedViolations.length - 8} more`);
  }
}
if (longClassViolations.length) {
  console.error("Class names over 3 segments:");
  [...new Set(longClassViolations)].forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("Style check passed.");
