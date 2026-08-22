const fs = require('fs');
let code = fs.readFileSync('src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx', 'utf8');

if (!code.includes('AnimatePresence')) {
  code = code.replace("import { motion } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';");
}

// 1. Wrap the activeGameHub check with AnimatePresence
code = code.replace("{activeGameHub === null ? (", "<AnimatePresence mode=\"wait\">\n      {activeGameHub === null ? (");
code = code.replace("      </OverlayScrollbarsComponent>", "      </AnimatePresence>\n      </OverlayScrollbarsComponent>");

// 2. Change the dashboard wrapper to motion.div
code = code.replace(
  '<div className="w-full flex flex-col relative min-h-full pb-8">\n          {/* Background gradient */',
  '<motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col relative min-h-full pb-8">\n          {/* Background gradient */'
);

// We need to change its closing div. It is right before:
//               </>
//           ) : (
// Actually, looking at previous output, there is an </> then ) : (.
// Let's replace:
//                 </div>
//               </>
//             ) : (
code = code.replace("                </div>\n              </>\n            ) : (", "                </motion.div>\n              </>\n            ) : (");

// 3. Change the gamehub wrapper to motion.div
code = code.replace(
  '            ) : (\n              <div className="flex flex-col gap-6">',
  '            ) : (\n              <motion.div key="gamehub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6 w-full relative min-h-full">'
);
// And its closing tag which is before </AnimatePresence>
code = code.replace('              </div>\n      </AnimatePresence>', '              </motion.div>\n      </AnimatePresence>');

// 4. Change the background image to motion.div with layoutId
code = code.replace(
  /<div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{backgroundImage: url\('\$\{getGameImageUrl\(activeGameHub\)\}'\)}}><\/div>/g,
  '<motion.div layoutId={game-bg-} initial={{ opacity: 1 }} animate={{ opacity: 0.15 }} exit={{ opacity: 1 }} className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{backgroundImage: url(\'\')}}></motion.div>'
);
// Wait! Earlier I saw the gamehub view actually started with: <div className="flex flex-col gap-6">
// Wait, no! The gamehub view in the previous output was:
//           ) : (
//              <div className="flex flex-col gap-6">
//                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-container-high pb-6">

// Ah! It's <div className="flex flex-col gap-6">, NOT <div className="w-full flex flex-col relative min-h-full pb-8">!

fs.writeFileSync('scratch/DashboardHub_fixed.tsx', code, 'utf8');
