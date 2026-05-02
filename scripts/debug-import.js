const fs = require("fs");
const path = require("path");
const file = "src/modules/admin-manage/admin-finance/index.ts";
const content = fs.readFileSync(file, "utf8");
const regex = /(['"])(\.\.\/[^'"\n]+|\.\/[^'"\n]+)\1/g;
let m;
while ((m = regex.exec(content))) {
  const relPath = m[2];
  const abs = path.resolve(path.dirname(file), relPath);
  console.log(relPath, abs, fs.existsSync(abs));
}
