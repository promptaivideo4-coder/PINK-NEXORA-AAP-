const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/screens/StaffDetail.tsx');
let content = fs.readFileSync(file, 'utf8');

const mapping = {
  "From ₹185": "From ₹14,500",
  "From ₹210": "From ₹16,500",
  "₹85": "₹6,500",
  "₹250": "₹20,000",
  "₹195": "₹15,000",
  "₹220": "₹17,500",
  "₹55": "₹4,500",
  "₹65": "₹5,000",
  "₹75": "₹6,000",
  "₹60": "₹4,800",
  "₹110": "₹8,500",
  "₹50": "₹4,000"
};

for (const [key, value] of Object.entries(mapping)) {
  content = content.replace(new RegExp(key, 'g'), value);
}

fs.writeFileSync(file, content);
