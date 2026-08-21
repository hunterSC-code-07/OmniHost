const { Project } = require('ts-morph');
const project = new Project({ tsConfigFilePath: 'tsconfig.web.json' });

const appFile = project.getSourceFile('src/renderer/src/App.tsx');
const appFunction = appFile.getFunction('App');

// 1. Remove unused imports
appFile.getImportDeclarations().forEach(imp => {
  const modSpec = imp.getModuleSpecifierValue();
  if (
    modSpec.includes('ConsoleTab') ||
    modSpec.includes('OptionsTab') ||
    modSpec.includes('PlayersTab') ||
    modSpec.includes('FilesTab') ||
    modSpec.includes('BackupsTab') ||
    modSpec.includes('OverviewTab') ||
    modSpec.includes('AnimatedBackground') ||
    modSpec.includes('lucide-react')
  ) {
    imp.remove();
  }
});

// 2. Remove unused hooks/vars in App component
if (appFunction) {
  const unusedVars = [
    'onlinePlayers', 'setOnlinePlayers',
    'advancedMode', 'setAdvancedMode',
    'playerListType', 'setPlayerListType',
    'isProcessing', 'setIsProcessing',
    'statsHistory', 'setStatsHistory',
    'selectedPlayer', 'setSelectedPlayer',
    'playerInventory', 'setPlayerInventory',
    'modSearchQuery', 'setModSearchQuery',
    'modResults', 'setModResults',
    'installProgressText', 'setInstallProgressText',
    'modViewType', 'setModViewType',
    'activeSortField', 'setActiveSortField',
    'isClassMenuOpen', 'setIsClassMenuOpen',
    'isSortMenuOpen', 'setIsSortMenuOpen',
    'totalModCount', 'setTotalModCount',
    'editingAvailableVersions', 'setEditingAvailableVersions',
    'editingLoaderVersion', 'setEditingLoaderVersion',
    'editingAvailableLoaderVersions', 'setEditingAvailableLoaderVersions',
    'isTypeMenuOpen', 'setIsTypeMenuOpen',
    'isVersionMenuOpen', 'setIsVersionMenuOpen',
    'isLoaderMenuOpen', 'setIsLoaderMenuOpen',
    'isChangingSoftware', 'setIsChangingSoftware',
    'classOptions',
    'handleInstallMod', 'handleDeleteMod', 'handleClearLogs',
    'handleSendCommand', 'sendPlayerCommand', 'handleSaveConfig',
    'handleAddPlayer', 'handleRemovePlayer'
  ];

  appFunction.getStatements().forEach(stmt => {
    if (stmt.getKindName() === 'VariableStatement') {
      const decls = stmt.getDeclarations();
      const name = decls[0].getName();
      if (unusedVars.includes(name)) {
        stmt.remove();
      }
    }
  });
}

appFile.saveSync();
console.log('App.tsx cleanup via AST completed.');
