// Finds every give_* function in the item sources so give.mcb needs no hand-kept list.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'item');
const gives = [];

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.name.endsWith('.mcb')) {
            const fnPath = path.relative(__dirname, full).split(path.sep).join('/').replace('.mcb', '');
            const text = fs.readFileSync(full, 'utf8');
            for (const m of text.matchAll(/^function (give_[a-z0-9_]+)/gm)) {
                gives.push({ name: m[1], id: 'foxcraft_dungeon_loot:' + fnPath + '/' + m[1] });
            }
        }
    }
}

walk(root);
module.exports = { gives };
