let configContent = `{\r
  "IpAddress": "0.0.0.0",\r
  "GamePort": 8766,\r
  "ServerSteamAccount": ""\r
}`;

function updateSteamToken(newToken) {
  if (configContent.match(/^\s*"ServerSteamAccount"/m)) {
    configContent = configContent.replace(/^(\s*)"ServerSteamAccount"\s*:\s*".*"/m, `$1"ServerSteamAccount": "${newToken}"`);
  } else {
    configContent = configContent.replace(/\{/, `{\n  "ServerSteamAccount": "${newToken}",`);
  }
}

updateSteamToken("a");
console.log("After update:", JSON.stringify(configContent));

let match = configContent.match(/^\s*"ServerSteamAccount"\s*:\s*"(.*)"/m);
console.log("Extracted:", match ? JSON.stringify(match[1]) : "null");
