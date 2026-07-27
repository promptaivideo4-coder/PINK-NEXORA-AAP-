import { Customer } from '../types';

export const exportCustomersToCSV = (customers: Customer[]) => {
  const headers = ['Name', 'Phone/WhatsApp Number', 'Email', 'City', 'Join Date', 'Membership Status', 'Total Spend'];
  const rows = customers.map(c => [
    c.name,
    c.whatsappNumber || c.phone,
    c.email,
    c.city || 'N/A',
    c.joinDate || 'N/A',
    c.type,
    c.spend || '0'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clients.csv';
  a.click();
};
