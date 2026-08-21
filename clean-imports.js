const { Project } = require('ts-morph');
const project = new Project();
project.addSourceFilesAtPaths("src/main/ipc/*.ts");
project.addSourceFilesAtPaths("src/main/index.ts");
project.addSourceFilesAtPaths("src/main/adapters/*.ts");

for (const sf of project.getSourceFiles()) {
  sf.fixUnusedIdentifiers();
}

project.saveSync();
console.log("Unused imports removed");
