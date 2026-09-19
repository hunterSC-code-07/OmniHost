let configContent = `{
  "IpAddress": "0.0.0.0",
  "GamePort": 8766,
  "ServerSteamAccount": ""
}`;

function updateSteamToken(newToken) {
  if (configContent.match(/^\s*"ServerSteamAccount"/m)) {
    configContent = configContent.replace(/^(\s*)"ServerSteamAccount"\s*:\s*".*"/m, `$1"ServerSteamAccount": "${newToken}"`);
  } else {
    configContent = configContent.replace(/\{/, `{\n  "ServerSteamAccount": "${newToken}",`);
  }
}

updateSteamToken("a");
console.log("After update:", configContent);

let match = configContent.match(/^\s*"ServerSteamAccount"\s*:\s*"(.*)"/m);
console.log("Extracted:", match ? match[1] : "null");
