const { Project, SyntaxKind } = require('ts-morph');
const project = new Project({ tsConfigFilePath: 'tsconfig.web.json' });

const appFile = project.getSourceFile('src/renderer/src/App.tsx');
const appFunction = appFile.getFunction('App');

const createModalVars = [
  'newServerName', 'newServerType', 'newServerVersion', 'availableVersions',
  'newServerLoaderVersion', 'availableLoaderVersions', 'isNewServerTypeMenuOpen',
  'isNewServerVersionMenuOpen', 'isNewServerLoaderMenuOpen', 'isCreatingServer',
  'downloadProgress', 'downloadText'
];

let createVarsText = '';
let handleCreateFuncText = '';
let createEffectsText = '';
const stmtsToRemove = [];

appFunction.getStatements().forEach(stmt => {
  if (stmt.getKind() === SyntaxKind.VariableStatement) {
    const decls = stmt.getDeclarations();
    const name = decls[0].getName();
    
    let isCreateVar = false;
    for (const v of createModalVars) {
      if (stmt.getText().includes(v)) {
        isCreateVar = true;
        break;
      }
    }
    
    if (isCreateVar && name !== 'showCreateModal') {
      createVarsText += stmt.getText() + '\n';
      stmtsToRemove.push(stmt);
    } else if (name === 'handleCreateServer') {
      handleCreateFuncText = stmt.getText() + '\n';
      stmtsToRemove.push(stmt);
    }
  } else if (stmt.getKind() === SyntaxKind.ExpressionStatement && stmt.getText().startsWith('useEffect')) {
    if (stmt.getText().includes('showCreateModal') && stmt.getText().includes('fetchVersions')) {
      createEffectsText += stmt.getText() + '\n';
      stmtsToRemove.push(stmt);
    }
  }
});

stmtsToRemove.forEach(s => s.remove());
appFile.saveSync();

const createModalFile = project.getSourceFile('src/renderer/src/components/modals/CreateServerModal.tsx');
if (createModalFile) {
  const modalFunc = createModalFile.getFunction('CreateServerModal');
  
  if (modalFunc.getParameters().length > 0) {
    modalFunc.getParameters()[0].remove();
    modalFunc.addParameter({ name: '{ setShowCreateModal, setServers, servers }: any' });
  }

  // Remove the old import if exists, add new one
  const reactImp = createModalFile.getImportDeclaration(i => i.getModuleSpecifierValue() === 'react');
  if (reactImp) reactImp.remove();

  createModalFile.addImportDeclaration({
    namedImports: ['useState', 'useEffect'],
    moduleSpecifier: 'react'
  });

  modalFunc.insertStatements(0, createVarsText + createEffectsText + handleCreateFuncText);
  createModalFile.saveSync();
  console.log('CreateServerModal logic extracted.');
} else {
  console.log("Could not find CreateServerModal.tsx");
}
