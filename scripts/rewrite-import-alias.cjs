const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "src");
const aliasPrefix = "@/";
const extensions = [".ts", ".tsx", ".js", ".jsx", ".json"];

const resolveTarget = (absolutePath) => {
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) return absolutePath;
  for (const ext of extensions) {
    if (fs.existsSync(`${absolutePath}${ext}`)) return `${absolutePath}${ext}`;
    if (fs.existsSync(path.join(absolutePath, `index${ext}`)))
      return path.join(absolutePath, `index${ext}`);
  }
  return null;
};

const walk = (dir, files = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walk(full, files);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

const files = walk(rootDir);
let changedFiles = 0;
let replacedImports = 0;

for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");
  let updated = content;

  updated = updated.replace(/(['"])(\.\.\/[^'"\n]+|\.\/[^'"\n]+)\1/g, (match, quote, relPath) => {
    const absBase = path.resolve(path.dirname(filePath), relPath);
    const target = resolveTarget(absBase);
    if (!target) return match;
    if (!target.startsWith(rootDir)) return match;
    let alias = aliasPrefix + path.relative(rootDir, target).replace(/\\/g, "/");
    alias = alias.replace(/\/index\.(ts|tsx|js|jsx)$/, "");
    alias = alias.replace(/\.(ts|tsx|js|jsx|json)$/, "");
    if (alias !== relPath) {
      replacedImports += 1;
      return `${quote}${alias}${quote}`;
    }
    return match;
  });

  if (updated !== content) {
    changedFiles += 1;
    fs.writeFileSync(filePath, updated, "utf8");
  }
}

console.log(`Processed ${files.length} files.`);
console.log(`Updated ${changedFiles} files with ${replacedImports} import paths.`);
