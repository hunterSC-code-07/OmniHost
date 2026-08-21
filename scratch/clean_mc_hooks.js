const { Project } = require('ts-morph');
const project = new Project();

const hubFile = project.addSourceFileAtPath('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx');
const hubFunction = hubFile.getFunction('MinecraftHub');

if (hubFunction) {
  const stmts = hubFunction.getStatements();
  stmts.forEach(stmt => {
    const text = stmt.getText();
    // Remove the initial data fetching useEffect since App.tsx handles global data loading
    if (text.includes('fetchInitialData') || text.includes('fetchCacheSize')) {
      stmt.remove();
    }
  });
}

// Remove unused variables
const unusedVars = ['DayzHub', 'isGameSupported', 'getGameImageUrl', 'showModpackPrompt'];
unusedVars.forEach(name => {
  const decl = hubFile.getVariableDeclaration(name);
  if (decl) decl.remove();
  
  const imp = hubFile.getImportDeclaration(imp => {
    const defaultImport = imp.getDefaultImport();
    if (defaultImport && defaultImport.getText() === name) return true;
    const namedImports = imp.getNamedImports();
    return namedImports.some(n => n.getName() === name);
  });
  if (imp) imp.remove();
});

hubFile.saveSync();
console.log('Fixed fetchInitialData and unused vars.');
