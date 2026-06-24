const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const ignored = new Set([".git", "node_modules", "miniprogram_npm", "dist"]);
const badFiles = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (ignored.has(name)) continue;
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!/\.(ts|js|json|wxml|wxss|md)$/.test(name)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    if (/\t/.test(content) || /[ \t]+$/m.test(content)) {
      badFiles.push(path.relative(root, fullPath));
    }
  }
}

walk(root);

if (badFiles.length > 0) {
  console.error("Formatting issues found:");
  for (const file of badFiles) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Format check passed.");
