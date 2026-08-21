const { Project } = require('ts-morph');
const project = new Project();

const hubFile = project.addSourceFileAtPath('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx');
const hubFunction = hubFile.getFunction('MinecraftHub');

if (hubFunction) {
  const stmts = hubFunction.getStatements();
  const funcsToRemove = [
    'handleCreateServer',
    'confirmDeleteServer',
    'handleClearCache',
    'formatBytes',
    'handleUpdateSteamCache',
    'handleStart',
    'handleStop',
    'handleRestart',
    'handleDelete',
    'handleTunnel'
  ];

  stmts.forEach(stmt => {
    if (stmt.getKindName() === 'VariableStatement') {
      const decls = stmt.getDeclarations();
      decls.forEach(decl => {
        const name = decl.getName();
        if (funcsToRemove.includes(name)) {
          console.log(`Removing function: ${name}`);
          stmt.remove();
        }
      });
    }
  });

  hubFile.saveSync();
  console.log('Functions removed via AST.');
}
