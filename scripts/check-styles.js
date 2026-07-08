const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "miniprogram");
const wxssFiles = [];
let importantCount = 0;
const longClassViolations = [];
const longFileViolations = [];
const nestedViolations = [];
const MAX_NEST_DEPTH = 2;

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

function getClassNestDepth(selector) {
  const trimmed = selector.trim();
  if (!trimmed || trimmed.startsWith("@")) return 0;
  const classes = trimmed.match(/\.[a-z][\w-]*/g);
  if (!classes) return 0;
  return classes.length - 1;
}

function findNestedSelectors(content, file) {
  const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = withoutComments.split("}");
  blocks.forEach((block) => {
    const selectorPart = block.split("{")[0];
    if (!selectorPart) return;
    selectorPart.split(",").forEach((selector) => {
      const depth = getClassNestDepth(selector);
      if (depth > MAX_NEST_DEPTH) {
        nestedViolations.push(`${path.relative(root, file)}: ${selector.trim()}`);
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
  findNestedSelectors(content, file);
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
  console.error(`Nested selectors over ${MAX_NEST_DEPTH} levels (max ${MAX_NEST_DEPTH + 1} classes):`);
  [...new Set(nestedViolations)].forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}
if (longClassViolations.length) {
  console.error("Class names over 3 segments:");
  [...new Set(longClassViolations)].forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("Style check passed.");
