// Finds every give_* function in the item sources so give.mcb needs no hand-kept list.
//
// plain  - give functions with an objective whose value is the amount to give
// enchants - the pack enchantments, one objective each whose value is the level of the enchanted book to give
// tiered - items with tier variants, one objective whose value picks the tier from the lowest (1) to the highest.
//          The base function is a tier too, its tier is the one of the loot table's default pool.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'item');
const tableRoot = path.join(__dirname, '..', '..', 'data', 'foxcraft_dungeon_loot', 'loot_table', 'item');
const ORDER = ['leather', 'chainmail', 'copper', 'iron', 'diamond', 'netherite', 'uncommon', 'rare', 'epic', 'mythic'];
const files = [];

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.name.endsWith('.mcb')) {
            files.push(full);
        }
    }
}

// The tier of the pool that is used when no variant score is set, from its base item such as minecraft:iron_sword.
function baseTier(relPath) {
    const file = path.join(tableRoot, relPath + '.json');
    if (!fs.existsSync(file)) return null;
    const table = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const pool of table.pools || []) {
        const cond = pool.condition;
        if (cond && cond.type === 'minecraft:entity_scores') continue;
        const item = pool.entries && pool.entries[0] && pool.entries[0].name;
        if (!item) continue;
        const tier = item.replace('minecraft:', '').split('_')[0];
        if (ORDER.indexOf(tier) >= 0) return tier;
    }
    return null;
}

walk(root);
const plain = [];
const tiered = [];

for (const full of files) {
    const rel = path.relative(__dirname, full).split(path.sep).join('/').replace('.mcb', '');
    const text = fs.readFileSync(full, 'utf8');
    const names = [];
    for (const m of text.matchAll(/^function (give_[a-z0-9_]+)/gm)) names.push(m[1]);
    const isVariant = (name) => ORDER.some((tier) => name.endsWith('_' + tier) && names.indexOf(name.slice(0, name.length - tier.length - 1)) >= 0);
    const fn = (name) => ({ name: name, id: 'foxcraft_dungeon_loot:' + rel + '/' + name });

    for (const name of names) {
        if (isVariant(name)) continue;
        const variants = names.filter((n) => isVariant(n) && n.startsWith(name + '_'));
        if (variants.length === 0) {
            plain.push(fn(name));
            continue;
        }
        // rel is item/<rarity>/<item> or a folder file like item/special/music_disc/main, which has no tiers
        const base = baseTier(rel.replace(/^item\//, ''));
        const tiers = variants.map((n) => ({ tier: n.slice(name.length + 1), fn: fn(n) }));
        tiers.push({ tier: base || ORDER[0], fn: fn(name) });
        tiers.sort((a, b) => ORDER.indexOf(a.tier) - ORDER.indexOf(b.tier));
        tiered.push({ name: name, id: fn(name).id, tiers: tiers.map((t) => ({ tier: t.tier, id: t.fn.id })) });
    }
}

// Written books, one plain give function per en_us source in src/books, given by the function in give.mcb.
// The generator's own finder decides what a book is, so the two cannot drift apart.
const { findSources } = require('../../scripts/book_loot_gen.js');
for (const id of Object.keys(findSources(path.join(__dirname, '..', 'books')).en_us || {})) {
    plain.push({ name: 'give_' + id, id: 'foxcraft_dungeon_loot:give/give_' + id, book: id });
}

// Pack enchantments, give_<name>_book for data/foxcraft_dungeon_loot/enchantment/<folders>/<name>.json
const enchantRoot = path.join(__dirname, '..', '..', 'data', 'foxcraft_dungeon_loot', 'enchantment');
const enchants = [];

function walkEnchants(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
        if (entry.isDirectory()) {
            walkEnchants(path.join(dir, entry.name), prefix + entry.name + '/');
        } else if (entry.name.endsWith('.json')) {
            const name = entry.name.replace('.json', '');
            const maxLevel = JSON.parse(fs.readFileSync(path.join(dir, entry.name), 'utf8')).max_level || 1;
            enchants.push({ name: 'give_' + name + '_book', enchantment: 'foxcraft_dungeon_loot:' + prefix + name, maxLevel: maxLevel });
        }
    }
}

walkEnchants(enchantRoot, '');

// Every objective, plain, tiered and enchantment books, for the load and uninstall functions
const gives = plain.concat(tiered, enchants);
module.exports = { gives, plain, tiered, enchants };
