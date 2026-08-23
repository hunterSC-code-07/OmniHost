const { SteamWebAPI } = require('./out/main/index.js');
SteamWebAPI.getModDependencies('3089074633').then(console.log).catch(console.error);