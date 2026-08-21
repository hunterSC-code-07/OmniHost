const { Project, SyntaxKind } = require('ts-morph');
const project = new Project({ tsConfigFilePath: 'tsconfig.web.json' });

const appFile = project.getSourceFile('src/renderer/src/App.tsx');
const appFunction = appFile.getFunction('App');

const steamModalVars = [
  'steamLoginAction', 'steamUsername', 'steamPassword', 'steamGuardCode', 
  'isSteamGuardRequired', 'isDayzCached'
];

let steamVarsText = '';
let handleSteamFuncText = '';
let steamEffectsText = '';
const stmtsToRemove = [];

appFunction.getStatements().forEach(stmt => {
  if (stmt.getKind() === SyntaxKind.VariableStatement) {
    const decls = stmt.getDeclarations();
    const name = decls[0].getName();
    
    let isSteamVar = false;
    for (const v of steamModalVars) {
      if (stmt.getText().includes(v)) {
        isSteamVar = true;
        break;
      }
    }
    
    if (isSteamVar && name !== 'showSteamLoginModal') {
      steamVarsText += stmt.getText() + '\n';
      stmtsToRemove.push(stmt);
    } else if (name === 'handleUpdateSteamCache') {
      handleSteamFuncText = stmt.getText() + '\n';
      stmtsToRemove.push(stmt);
    }
  } else if (stmt.getKind() === SyntaxKind.ExpressionStatement && stmt.getText().startsWith('useEffect')) {
    if (stmt.getText().includes('checkSteamCache')) {
      steamEffectsText += stmt.getText() + '\n';
      stmtsToRemove.push(stmt);
    }
  }
});

stmtsToRemove.forEach(s => s.remove());
appFile.saveSync();

const steamModalFile = project.getSourceFile('src/renderer/src/components/modals/SteamLoginModal.tsx');
if (steamModalFile) {
  const modalFunc = steamModalFile.getFunction('SteamLoginModal');
  
  if (modalFunc.getParameters().length > 0) {
    modalFunc.getParameters()[0].remove();
    modalFunc.addParameter({ name: '{ setShowSteamLoginModal, showToast, activeGameHub }: any' });
  }

  const reactImp = steamModalFile.getImportDeclaration(i => i.getModuleSpecifierValue() === 'react');
  if (reactImp) reactImp.remove();

  steamModalFile.addImportDeclaration({
    namedImports: ['useState', 'useEffect'],
    moduleSpecifier: 'react'
  });

  modalFunc.insertStatements(0, steamVarsText + steamEffectsText + handleSteamFuncText);
  steamModalFile.saveSync();
  console.log('SteamLoginModal logic extracted.');
} else {
  console.log("Could not find SteamLoginModal.tsx");
}
