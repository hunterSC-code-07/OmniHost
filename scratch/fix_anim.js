const fs = require('fs');
const wipPath = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx';

try {
  let code = fs.readFileSync(wipPath, 'utf8');

  if (!code.includes('AnimatePresence')) {
    code = code.replace("import { motion } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';");
  }

  // Wrap the ternary with AnimatePresence
  // Find {activeGameHub === null ? (
  code = code.replace("{activeGameHub === null ? (", "<AnimatePresence mode=\"wait\">\n      {activeGameHub === null ? (");
  
  // Find the end of the ternary, which is right before </OverlayScrollbarsComponent>
  code = code.replace("      </OverlayScrollbarsComponent>", "      </AnimatePresence>\n      </OverlayScrollbarsComponent>");

  // Change the top level div of activeGameHub === null branch to motion.div
  code = code.replace(
    /<div className="w-full flex flex-col relative min-h-full pb-8">\s*{\/\* Background gradient \*\/}/,
    '<motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col relative min-h-full pb-8">\n          {/* Background gradient */}'
  );

  // Change the top level div of activeGameHub !== null branch to motion.div
  // Wait, in DashboardHub.tsx, the activeGameHub view starts with: <div className="w-full flex flex-col relative min-h-full pb-8">
  // We need to replace the second instance of this div!
  
  let parts = code.split('<div className="w-full flex flex-col relative min-h-full pb-8">');
  if (parts.length === 2) {
      // Meaning the first one was already replaced (since it had the comment next to it, or didn't match the comment)
      // Actually, let's just replace the exact line.
      code = parts[0] + '<motion.div key="gamehub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col relative min-h-full pb-8">' + parts[1];
  }

  // And replace the closing tags of these divs
  // It's tricky to replace just the closing tag. But wait, if they are motion.div, we have to change the closing tag from </div> to </motion.div>.
  // The first one ends before: ) : (
  code = code.replace("                </div>\n              </>\n            ) : (", "                </motion.div>\n              </>\n            ) : (");
  
  // Wait, the first one didn't have </>. Let's see the exact structure.
  
  fs.writeFileSync('scratch/debug.txt', code, 'utf8');
} catch (e) {
  console.error(e);
}
