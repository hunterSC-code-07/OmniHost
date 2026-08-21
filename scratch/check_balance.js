const fs = require('fs');

const content = fs.readFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', 'utf8');

let parenCount = 0;
let braceCount = 0;
let bracketCount = 0;
let lineNum = 1;

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (c === '\n') lineNum++;
  else if (c === '(') parenCount++;
  else if (c === ')') parenCount--;
  else if (c === '{') braceCount++;
  else if (c === '}') braceCount--;
  else if (c === '[') bracketCount++;
  else if (c === ']') bracketCount--;

  if (parenCount < 0) { console.log(`Unbalanced ) at line ${lineNum}`); parenCount = 0; }
  if (braceCount < 0) { console.log(`Unbalanced } at line ${lineNum}`); braceCount = 0; }
  if (bracketCount < 0) { console.log(`Unbalanced ] at line ${lineNum}`); bracketCount = 0; }
}

console.log(`Final balance: parens=${parenCount}, braces=${braceCount}, brackets=${bracketCount}`);
