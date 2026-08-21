const fs = require('fs');
const content = fs.readFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', 'utf8');

// Find where the `{` and `(` go unbalanced.
let parenCount = 0;
let braceCount = 0;
let bracketCount = 0;
let lineNum = 1;

const stack = [];

for (let i = 0; i < content.length; i++) {
  const c = content[i];
  if (c === '\n') lineNum++;
  else if (c === '(') { parenCount++; stack.push({char: '(', line: lineNum}); }
  else if (c === ')') { 
    parenCount--; 
    for (let j=stack.length-1; j>=0; j--) { if (stack[j].char === '(') { stack.splice(j, 1); break; } }
  }
  else if (c === '{') { braceCount++; stack.push({char: '{', line: lineNum}); }
  else if (c === '}') { 
    braceCount--; 
    for (let j=stack.length-1; j>=0; j--) { if (stack[j].char === '{') { stack.splice(j, 1); break; } }
  }
}

console.log(stack);
