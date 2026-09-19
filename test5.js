let str = '"ServerSteamAccount": ""\r\n';
let replaced = str.replace(/"ServerSteamAccount":\s*".*"/m, 'REPLACED');
console.log(replaced.includes('\r'));
console.log(JSON.stringify(replaced));
