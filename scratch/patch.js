const fs = require('fs');
const file = 'G:/Github/serverProjV2/OmniHost/.omnihost-data/servers/31/DayZServer_x64.exe';
const bak = file + '.bak';
if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
const buf = fs.readFileSync(file);

function scan(buf, patternStr) {
    const pattern = patternStr.split(' ').map(p => p === '?' ? -1 : parseInt(p, 16));
    for (let i = 0; i < buf.length - pattern.length; i++) {
        let match = true;
        for (let j = 0; j < pattern.length; j++) {
            if (pattern[j] !== -1 && buf[i + j] !== pattern[j]) {
                match = false;
                break;
            }
        }
        if (match) return i;
    }
    return -1;
}

const addr1 = scan(buf, '40 53 55 56 57 41 54 48 81 EC ? ? ? ? 45 33 E4 48 8B D9 44 89');
if (addr1 !== -1) {
    buf.writeUInt8(0xB0, addr1);
    buf.writeUInt8(0x01, addr1 + 1);
    buf.writeUInt8(0xC3, addr1 + 2);
    console.log('Patched BattlEye Init at', addr1);
} else {
    console.log('Failed to find BattlEye Init pattern');
}

const addr2 = scan(buf, '74 44 0F B7 C8 E8 ? ? ? ? 8B 13 44 0F B7 C0 44 89 4C 24 ? 48');
if (addr2 !== -1) {
    buf.writeUInt8(0xEB, addr2);
    console.log('Patched VAC check at', addr2);
} else {
    const addr2alt = scan(buf, '74 5C B8 ? ? ? ? 66 3B C3 75 09 E8 ? ? ? ? 84 C0 74 49 0F B7');
    if (addr2alt !== -1) {
        buf.writeUInt8(0xEB, addr2alt);
        console.log('Patched VAC check (alt) at', addr2alt);
    } else {
        console.log('Failed to find VAC pattern');
    }
}

fs.writeFileSync(file, buf);
console.log('Saved patched executable.');
