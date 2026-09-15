const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') && !file.includes('ServerStorage.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/main');
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const target1 = "join(app.getPath('userData'), 'servers')";
  const replace1 = "serverStorage.getPath()";
  
  const target2 = "join(app.getPath('userData'), 'servers',";
  const replace2 = "join(serverStorage.getPath(),";

  const target3 = "resolve(app.getPath('userData'), 'servers',";
  const replace3 = "resolve(serverStorage.getPath(),";

  if (content.includes(target1) || content.includes(target2) || content.includes(target3)) {
    content = content.replace(new RegExp(target1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace1);
    content = content.replace(new RegExp(target2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace2);
    content = content.replace(new RegExp(target3.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace3);
    
    // Add import statement if not exists
    if (!content.includes('import { serverStorage } from')) {
      const depth = file.split(path.sep).length - 3; // src/main/...
      let relPath = '../'.repeat(depth) + 'storage/ServerStorage';
      if (depth === 0) relPath = './storage/ServerStorage';
      else if (depth === 1 && file.includes('main\\index.ts')) relPath = './storage/ServerStorage'; // Edge case
      content = `import { serverStorage } from '${relPath}'\n` + content;
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
