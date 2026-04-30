const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..', 'src');
const files = [];
const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
};
walk(rootDir);
const resolveTarget = (absolutePath) => {
  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) return absolutePath;
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
  for (const ext of extensions) {
    if (fs.existsSync(`${absolutePath}${ext}`)) return `${absolutePath}${ext}`;
    if (fs.existsSync(path.join(absolutePath, `index${ext}`))) return path.join(absolutePath, `index${ext}`);
  }
  return null;
};
const regex = /(['"])(\.\.\/[^'"\n]+|\.\/[^'"\n]+)\1/g;
let total = 0;
let unresolved = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = regex.exec(content))) {
    const relPath = m[2];
    const absBase = path.resolve(path.dirname(file), relPath);
    const target = resolveTarget(absBase);
    if (target) continue;
    console.log(`${file}:${content.substr(0,m.index).split('\n').length}:${relPath}`);
    unresolved += 1;
    total += 1;
  }
}
console.log(`Unresolved: ${unresolved}`);
