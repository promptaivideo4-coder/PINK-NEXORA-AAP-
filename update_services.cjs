const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/ServicesList.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update categories
content = content.replace("const categories = ['All', 'Hair', 'Nails', 'Spa', 'Aesthetic'];", "const categories = ['All', 'Hair', 'Makeup', 'Skin & Spa', 'Threading', 'Mehendi'];");

// Update initialServices data to use the new categories and add new items
const initialServicesStr = `const initialServices: ServiceItem[] = [
  {
    id: '1',
    name: 'Balayage & Styling',
    description: 'Full balayage treatment with toner, root smudge, and signature blowout styling.',
    duration: 120,
    price: 3500,
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    name: 'Bridal Makeup Package',
    description: 'Complete bridal makeup including HD makeup, hair styling, and draping.',
    duration: 180,
    price: 15000,
    category: 'Makeup',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    name: 'De-tan & Bleach',
    description: 'O3+ De-tan pack with gentle skin bleach for face and neck.',
    duration: 45,
    price: 800,
    category: 'Skin & Spa',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    name: 'Eyebrow Threading',
    description: 'Precision eyebrow shaping and upper lip threading.',
    duration: 15,
    price: 100,
    category: 'Threading',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '5',
    name: 'Bridal Mehendi / Heena',
    description: 'Intricate traditional bridal mehendi design for hands and feet.',
    duration: 240,
    price: 5000,
    category: 'Mehendi',
    image: 'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '6',
    name: 'L\'Oréal Hair Spa',
    description: 'Deep conditioning L\'Oréal hair spa with scalp massage and steam.',
    duration: 60,
    price: 1200,
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800'
  },
];`;

content = content.replace(/const initialServices: ServiceItem\[\] = \[([\s\S]*?)\];/g, initialServicesStr);

fs.writeFileSync(file, content);
