let configContent = `  "ServerSteamAccount": ""`;
let newToken = "a";

console.log("Original:", configContent);

configContent = configContent.replace(/^(\s*)"ServerSteamAccount"\s*:\s*".*"/m, `$1"ServerSteamAccount": "${newToken}"`);
console.log("Replaced:", configContent);

let match = configContent.match(/^\s*"ServerSteamAccount"\s*:\s*"(.*)"/m);
console.log("Extracted:", match ? match[1] : "FAILED");
