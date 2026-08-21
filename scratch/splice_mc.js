const fs = require('fs');

const hubPath = 'src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx';
let content = fs.readFileSync(hubPath, 'utf8');

// The return statement starts with: `  return (`
// Let's replace the entire `return (...)` block with just the `ACTIVE SERVER VIEW` for Minecraft.
// We know `ACTIVE SERVER VIEW` for Minecraft starts inside `) : (` after `<DayzHub ... />`
// It's the div: `<div className="flex-1 flex flex-col relative overflow-hidden">`

const startTag = '<div className="flex-1 flex flex-col relative overflow-hidden">';
const startIdx = content.indexOf(startTag);

// Let's find the closing tag for this div.
let balance = 0;
let endIdx = -1;
for (let i = startIdx; i < content.length; i++) {
  if (content.substr(i, 4) === '<div') balance++;
  if (content.substr(i, 5) === '</div') {
    balance--;
    if (balance === 0) {
      endIdx = i + 6; // Includes `</div>`
      break;
    }
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log('Failed to find bounds.');
  process.exit(1);
}

const extractedJSX = content.substring(startIdx, endIdx);

// Now replace everything from `return (` to the end of the component with the extracted JSX.
const returnIdx = content.indexOf('return (');
const endOfComponentIdx = content.lastIndexOf('}'); // Assuming the last brace is the end of the file/component

const newContent = content.substring(0, returnIdx) + 'return (\n    ' + extractedJSX + '\n  );\n}';

fs.writeFileSync(hubPath, newContent);
console.log('Spliced successfully.');
