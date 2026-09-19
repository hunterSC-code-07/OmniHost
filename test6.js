const configContent = `{
  "IpAddress": "0.0.0.0",
  "ServerSteamAccount": ""
}`;

function test() {
  let parsedConfig = {};
  try {
    parsedConfig = JSON.parse(configContent);
  } catch (e) {
    console.log("Parse failed");
  }

  console.log("Steam token is:", parsedConfig.ServerSteamAccount);

  const newToken = "A";
  try {
    const config = JSON.parse(configContent);
    config.ServerSteamAccount = newToken;
    console.log("New configContent:", JSON.stringify(config, null, 2));
  } catch (e) {
    console.log("Update failed");
  }
}

test();
