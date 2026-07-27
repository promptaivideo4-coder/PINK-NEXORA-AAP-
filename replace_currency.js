const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Match $ followed by numbers, e.g., $150, $4,200, $2.4k, $12,850
  // But wait, there are also cases like '$15 Off'
  content = content.replace(/\$([0-9.,k]+)/g, '₹$1');
  
  // Replace standalone $ that are part of text describing prices
  content = content.replace(/US Dollar \(\$\)/g, 'Indian Rupee (₹)');
  fs.writeFileSync(filePath, content, 'utf8');
}

const dir = path.join(__dirname, 'src/screens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  replaceInFile(path.join(dir, file));
}
console.log('Done');
