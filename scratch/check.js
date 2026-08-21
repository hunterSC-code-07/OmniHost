const fs = require('fs');
const code = fs.readFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', 'utf8');

let p = 0;
let b = 0;
let inString = false;
let inComment = false;
let inMultiComment = false;
let stringChar = '';
let lines = code.split('\n');

for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
  const line = lines[lineIndex];
  for(let i=0; i<line.length; i++) {
    const c = line[i];
    const next = line[i+1];
    
    if (!inString && !inComment && !inMultiComment) {
      if (c === '/' && next === '/') { inComment = true; i++; continue; }
      if (c === '/' && next === '*') { inMultiComment = true; i++; continue; }
      if (c === '"' || c === "'") { inString = true; stringChar = c; continue; }
      if (c === '`') { inString = true; stringChar = c; continue; }
      
      if (c === '(') p++;
      if (c === ')') p--;
      if (c === '{') b++;
      if (c === '}') b--;
    } else if (inComment) {
      // do nothing, handled at end of line
    } else if (inMultiComment) {
      if (c === '*' && next === '/') { inMultiComment = false; i++; }
    } else if (inString) {
      if (c === '\\') i++;
      else if (c === stringChar) inString = false;
    }
  }
  inComment = false; // reset single line comment at end of line
  if ((lineIndex + 1) % 50 === 0) {
    console.log('Line', lineIndex + 1, 'P:', p, 'B:', b);
  }
}
console.log('End Parens:', p, 'End Braces:', b);
