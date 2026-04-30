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
const regex = /(?:import|export)\s+(?:type\s+)?(?:[^\n]*?from\s+)?(['"])(\.\.\/[^'"\n]+|\.\/[^'"\n]+)\1/g;
let total = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\/\//.test(line)) continue;
    let match;
    while ((match = regex.exec(line))) {
      console.log(`${file}:${i + 1}:${match[2]}`);
      total += 1;
    }
  }
}
console.log(`Found ${total} relative import/export matches.`);
