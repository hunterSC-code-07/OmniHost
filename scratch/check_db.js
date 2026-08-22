const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'omnihost', 'omnihost.db');
try {
  const db = new Database(dbPath, { readonly: true });
  const servers = db.prepare('SELECT * FROM servers').all();
  console.log(JSON.stringify(servers, null, 2));
} catch (e) {
  console.error(e);
}
