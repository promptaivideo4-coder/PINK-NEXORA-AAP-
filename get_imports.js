const fs = require('fs');
console.log(fs.readFileSync('src/screens/Bookings.tsx', 'utf8').split('\n').slice(0, 50).join('\n'));
