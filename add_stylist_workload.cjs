const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/screens/Bookings.tsx');
let content = fs.readFileSync(file, 'utf8');

const workloadWidget = `        {/* Stylist Workload Widget */}
        <section className="mb-6">
          <h3 className="text-[18px] font-semibold text-on-surface mb-3">Stylist Workload (Today)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: 'Rohan V.', role: 'Senior Stylist', booked: 6, max: 8, color: 'emerald' },
              { name: 'Ananya S.', role: 'Colorist', booked: 4, max: 6, color: 'blue' },
              { name: 'Aditi M.', role: 'Therapist', booked: 7, max: 7, color: 'rose' }
            ].map(staff => (
              <div key={staff.name} className="bg-surface border border-surface-variant rounded-[16px] p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-xs">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-on-surface leading-none">{staff.name}</h4>
                      <span className="text-[11px] text-on-surface-variant font-medium">{staff.role}</span>
                    </div>
                  </div>
                  <span className={\`text-[11px] font-bold px-2 py-0.5 rounded-full \${staff.booked === staff.max ? 'bg-error/10 text-error' : 'bg-emerald-500/10 text-emerald-700'}\`}>
                    {staff.booked === staff.max ? 'Fully Booked' : 'Available'}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-on-surface-variant mb-1">
                    <span>Capacity: {staff.booked}/{staff.max} bookings</span>
                    <span>{Math.round((staff.booked/staff.max)*100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={\`h-full rounded-full transition-all duration-500 \${staff.booked === staff.max ? 'bg-error' : 'bg-emerald-500'}\`} style={{ width: \`\${(staff.booked/staff.max)*100}%\` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
`;

content = content.replace("<div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4\">", workloadWidget + "\n        <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-4\">");

// Add Reassign button to In-Progress or Pending bookings
// But first, let's see how they are structured
fs.writeFileSync(file, content);
