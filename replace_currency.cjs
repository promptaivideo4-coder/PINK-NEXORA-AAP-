const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\$([0-9.,k]+)/g, '₹$1');
  fs.writeFileSync(filePath, content, 'utf8');
}

const dir = path.join(__dirname, 'src/screens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  replaceInFile(path.join(dir, file));
}
console.log('Done');
