const fs = require('fs');

['src/renderer/src/App.tsx', 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx'].forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/\\\$/g, '$');
  text = text.replace(/\\`/g, '`');
  fs.writeFileSync(f, text);
});
