const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/Bookings.tsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace("నమస్కారం! నెక్సోరా సెలూన్లో మీ అపాయింట్మెంట్ గురించి గుర్తు చేస్తున్నాము.", "नमस्ते! हम आपको नेक्सोरा सैलून में आपकी अपॉइंटमेंट की याद दिला रहे हैं।");
fs.writeFileSync(file, content);
