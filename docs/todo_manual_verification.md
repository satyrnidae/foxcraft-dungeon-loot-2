# Manual verification (in game, 26.3)

Running list for issue #130. Parse checks (Scan, CmdCheck, check_old_keys) cannot see runtime behavior, so these need a world.
Append a section per phase. Tick a box when verified, note failures inline.

Setup: fresh 26.3 world, datapack and texturepack from a local build, operator, `/reload`, no errors in the log.
Dev helpers: `config.json` `mc.dev: true` makes armor stands visible and re-enables the variant trigger.

## Phase 3 - items as components

- [ ] `/loot give @s loot foxcraft_dungeon_loot:item/<rarity>/<item>` for a sample of each rarity: name, lore, enchantments, attributes, hidden tooltip parts look right.
- [ ] Items with a tier (chainsaw, auto pickaxe, etc.): the `satyrn.fdl.loot.variant` score picks the right tier and base item.
- [ ] Potions (`loot/potions`): effects, color and name correct.
- [ ] Player heads (`loot/heads`): skin textures load. Marie_Annelise head is gone from the uncommon pool.
- [ ] Coins: stack to 99. Armor stand loot (9 tables): spawns with arms and pose.
- [ ] Armor sets (Estudinae's Guidance, Patience, Script, Survival): dyed color 5215783 applied on every tier.
- [ ] Unbreakable items show no durability bar.
- [ ] Advancement icons render (advancements screen).
- [ ] Each custom item's hook still fires, so `custom_data` predicates match (spot check one per hook tag).
- [ ] Texture pack: every custom item shows its model, no purple-black. State models (bow pulling, horn tooting, shield blocking) show only the idle look until phase 6.

## Phase 4a - item components in commands

- [ ] Unbreaking: hold or wear an item with Unbreaking III for each item that reads it (beta_iron_sword, buckwheat, downpour_amulet, evokers_tome, poncho_sanchezs_fate, scripture_of_cleansing, gravilock_boots, quet_zalas_beloved, war_hogs_disdainful_pride). Durability drops less often than without it, and no command errors in the log.
- [ ] War Hog's Blighted Harvest: kill mobs, the Souls count on the item rises and the item name/lore updates; at 10 souls the wither burst fires.
- [ ] War Hog's Burning Rage: thrown item entity appears with the right item, owner and thrower, and drops as the real item.
- [ ] `break_item` particle: let an item of each kind break (17 items). The break particles show the item's own model, not an error particle or a plain vanilla one.
- [ ] Silverfish Escape Artist and X No Evil particles show the right model.
- [ ] `should_damage_tool` / `should_damage_armor`: tools and armor take damage at a believable rate, with and without Unbreaking. The `math.mcb` objective fix means this branch never ran in 1.19, so watch for a stuck-at-always or never-damaged result.

## Phase 4a-2 - entity NBT

- [ ] Wandering trader: spawn one (`/summon wandering_trader`). Trade index stand appears (visible in dev mode) holding a snowball. Trades populate, no log errors.
- [ ] Trade state: buy something, leave and re-open. `AddedTrades` grows and trades are not duplicated. In dev mode `/data get entity @e[tag=satyrn.fdl.wanderingTrader.tradeIndex,limit=1] equipment.mainhand.components` shows `minecraft:custom_data` with the three keys.
- [ ] Recipe storage: `/data get storage foxcraft_dungeon_loot:trades Current` after a trade build shows `count` ints, not `Count` bytes.
- [ ] X No Evil: throw it. A tracker stand follows the snowball, the snowball passenger is the X No Evil model, and on landing a cloud spawns with one of the 7 effects (blindness, hunger, wither, poison, nausea, instant damage IV, slowness III) applied to players standing in it.
- [ ] X No Evil: the cloud's owner is the thrower (`/data get entity <cloud> Owner`).
- [ ] War Hog's Blighted Harvest: the short cloud with soul particles shows at 10 souls.
- [ ] Fall events: `fall_distance` read works. Fall from height with a fall-event item (boots) and check the event fires at the right threshold.

## Phase 4b - /random

- [ ] No `Rolled random number` or similar `/random` feedback in chat when any random item, trade or tool damage runs.
- [ ] Dice: d4, d6, d8, d10, d12, d20 each roll in range and the message reads "Rolled a N out of M" with the right M ("an 8", "an 11", "an 18" wording unchanged).
- [ ] Spam lockout still triggers on rapid dice rolls.
- [ ] Trader: prices and max uses vary between trader spawns and stay inside their ranges.
- [ ] Randomized items (hero's amulet, eye cream, tithe to uthiir, ima leaf, bringer of fear, pride and extreme prejudice, poncho sanchez's fate, estudinae's sorrow, burning rage): outcomes vary.
- [ ] No leftover `satyrn.fdl.random` markers: `/execute as @e[type=marker] run say hi` shows none after a few rolls.

## Phase 4c.2 - Scripture of Cleansing

- [ ] Item with Curse of Vanishing in offhand, helmet, chestplate, leggings, boots, and in each of: hotbar slot, main inventory slot. Use the scripture each time: the curse is removed from that slot only, the other enchantments stay, the message names the right slot.
- [ ] Same for Curse of Binding.
- [ ] Item with both curses: vanishing goes first, a second use removes binding.
- [ ] Items with a curse in several slots: only one item is cleansed per use, in the order offhand, head, chest, legs, feet, then inventory.
- [ ] Curse at level 1 only is the normal case. Also test an enchanted book is untouched (stored enchantments) and an item without curses gives the "unable to uncurse" message, smoke and cooldown still apply.
- [ ] Cooldown, durability loss and break behavior unchanged. XP orb and cast sound on success.
- [ ] No stray `satyrn.fdl.cleaner` armor stand appears.
- [ ] Log shows no `set_enchantments` or `item modify` errors.

## Phase 4c.3 - durability odds

- [ ] Use a tool item (Scripture of Cleansing or Evoker's Tome) 50+ times with Unbreaking III, then with none. Expect roughly 1 in 4 uses to cost durability with it, every use without.
- [ ] Armor item (Gravilock Boots) with Unbreaking III: roughly 70% of triggers cost durability (60% + 40%/4); without Unbreaking, always.
- [ ] Item at 1 durability breaks with the break sound and particle, and is removed from the slot.
- [ ] Durability bar fraction per use looks right for each base item (boots tiers, elytra, warped fungus on a stick).

## Phase 4c.4 - use detection (unchanged logic, 26.3 behavior check)

- [ ] Right-click with each kind of warped fungus on a stick item (not riding anything): its `on_warped_fungus_used` hook fires once per click.
- [ ] Same with an offhand item from `#foxcraft_dungeon_loot:prevents_use` (snowball, bow, goat horn, etc.) in the offhand: the stick does not fire.
- [ ] Throw an event-enabled snowball (X No Evil): fires once per throw. A plain snowball does not.
- [ ] Eat a spider eye with a spider-eye item active, and block with a shield holding a block item: the matching events fire once each.
- [ ] Use counts reset: hold right-click on the stick for several seconds, hook should not keep firing after release.

## Phase 5 - trades

- [ ] Spawn a wandering trader with `/summon`, wait for the index build ("Building trade index..." in chat on load) and for the trader to finish, then trade window opens.
- [ ] Vanilla trades are gone and only the pack's offers appear. If vanilla offers still show, the pre-filled `Offers` is not suppressing them.
- [ ] Each offer type shows correct items: grab bags, heads, dungeon loot, goat horns, exchange rates, endgame. Names, lore and models intact.
- [ ] Prices: buy and second buy counts within their ranges, and "0" second-buy rolls show a single-cost trade, not a broken or free one.
- [ ] Pay with real coins from loot: the offer accepts them. Coins that differ in any component (hand-renamed, wrong stack from another source) are refused.
- [ ] Coin stacks above 64 (up to 99) work as payment, and 99-stack sell counts show correctly in the UI.
- [ ] Max uses and the uses counter decrement. Trader restock behavior is as before.
- [ ] Llamas follow the trader on a leash after spawn (`leash` data key), and carry the trader as owner.
- [ ] Trader state stand is removed after trades are added, and the trader's AI turns back on.
- [ ] Trade welcome message and glow on spawn.

## Phase 6 - resource pack

- [ ] Pack loads on 26.3 with no "unsupported pack format" warning and no missing model, texture or definition errors in the log.
- [ ] Every custom item shows its own model in inventory, hand, ground, item frame and GUI. Walk through `/loot give` for each rarity folder and the coin, potion-free tool and horn tables.
- [ ] Peerless Yewhewn: idle model, then pulling stages at the bow's 0.65 and 0.9 charge thresholds.
- [ ] Shield item (iron_sword model): shows the sword idle and the blocking sword while blocking. A plain vanilla shield still renders normally, in hand and blocking.
- [ ] Copper goat horn: normal model, tooting model while sounding.
- [ ] Vanilla look unchanged: bow, goat horn, snowball, totem, feather, nuggets, tools and books without the pack's items.
- [ ] Silverfish Escape Artist uses the 26.3 silverfish texture (`entity/silverfish/silverfish`), not a purple-black square.
- [ ] Tiered items (chainsaw, auto pickaxe) show the tier model. Higher armor tiers of Estudinae's sets and similar still use the vanilla look; decide if they need their own models.
- [ ] Music disc 11 base item still looks like vanilla disc 11. Its custom disc models are phase 8.
- [ ] War Hog wrath post effect: `/effect`-free check, `war_hog_wrath` loads as a post effect. It is not referenced by anything yet.

## Phase 8a - copper goat horn

- [ ] `/reload` shows no instrument, sound or modifier errors. `/loot give @s loot foxcraft_dungeon_loot:item/random_loot/single_copper_goat_horn` gives a horn; all ten songs appear over a few rolls.
- [ ] Holding a horn and standing still looking level: right-click plays the melody part for the full 4 seconds. `/data get entity @s SelectedItem.components."minecraft:instrument"` ends in `_melody`.
- [ ] Sneaking: the instrument changes to `_bass` and the bass part plays. Looking up 30 degrees or more (not sneaking): `_harmony`. Sneaking wins over looking up.
- [ ] Changing stance while the horn is held swaps the instrument at the next click, with no inventory flicker.
- [ ] Horn in the offhand behaves the same.
- [ ] Sound carries far: audible from about 256 blocks, subtitle reads "Copper Goat Horn plays". No vanilla goat horn sound plays on top.
- [ ] Note particles show now and then while the horn is being used (random, about every half second) and stop when use ends. No cooldown scoreboard is involved; the item's own use cooldown applies.
- [ ] Tooltip shows the horn name and song lore only, no extra instrument line.
- [ ] A copper horn from the previous version (old `CustomInstrument` custom data, `minecraft:admire_goat_horn` instrument) is swapped to the new instruments as soon as it is held.
- [ ] Trading for a horn still awards the Instrumentalist advancement.
- [ ] Update from the previous version (scoreboardsVersion 4 -> 5): the old `satyrn.fdl.copperGoatHorn.soundCooldown` and `.particle` objectives are gone after `/reload`, `currentPitch` exists, and removal of the datapack leaves none behind.

## Phase 8b - music discs

- [ ] `/reload` shows no jukebox song, sound or lang errors. The 22 Wolfgun and the C418 audio are present in the resource pack folder (gitignored) or the client logs missing sounds for those.
- [ ] `/function foxcraft_dungeon_loot:item/special/music_disc/main/give_captainzephyrr_acornman` and the same for a Wolfgun disc and `give_c418_dog`: a cat-base disc appears with its own texture, and the tooltip shows "Artist - Title".
- [ ] Each disc plays in a jukebox, shows the right title in the action bar, and ends at the right time. Check at least 5 mdoadq, 5 Wolfgun and Dog.
- [ ] Comparator output next to a jukebox with each disc matches the value in its `jukebox_song`. Dog is set to 6, adjust if you want another.
- [ ] No leftover `music_disc_11` override: a vanilla disc 11 and a vanilla cat disc look and play normally.
- [ ] Every disc texture renders (inventory and ground), none purple-black.
- [ ] `/loot give @s loot foxcraft_dungeon_loot:item/special/music_disc/<artist>_<title>` works and the item carries `DungeonLootId` 88 to 138.
- [ ] Credits in the README match the tracks.

## Phase 8c - disc distribution

- [ ] Trader: spawn several wandering traders (dev mode forces 2 disc trades). Each shows 0 to 2 disc trades in a separate group of offers, never the same disc twice on one trader.
- [ ] Disc trades cost 2 to 10 gold coins, no second cost, and accept real gold coins from loot. Sold discs are a mix of custom discs and base game discs, base game ones show their normal look.
- [ ] A bought custom disc plays in a jukebox and carries its `DungeonLootId`.
- [ ] Trades from the other groups (heads, grab bags, horns, dungeon loot, exchange, endgame) still appear and keep their price ranges. The trade count per group is unchanged.
- [ ] No duplicate offers and no empty or broken offers anywhere after the index grew from 98 to 171 entries.
- [ ] Chests: open many simple dungeon, ancient city, stronghold and woodland mansion chests (or `/loot` them). Disc slots that were 13, cat or otherside now give the vanilla disc about half the time and a random custom disc otherwise. Other loot in those chests is unchanged.
- [ ] Creeper killed by a skeleton drops either a base game disc or a custom disc, about half each. Gunpowder drop is unchanged, and creepers killed by anything else drop no disc.
- [ ] Unique discs stay vanilla: pigstep (bastion), relic (trail ruins), creator and precipice (trial chambers), creator music box (trial pot), bounce, tears (ghast), lava chicken (zombie).
- [ ] The overrides in `data/minecraft/loot_table/` match the 26.3 vanilla tables apart from the disc entries; diff them again after a Minecraft update.

## Review fixes

- [ ] Wing of Quet Zala and Wing of Ouet Zala: carrying one in the inventory (not worn) triggers the occasional 5 second levitation or nausea clock.
- [ ] Tithe to Uthiir: hitting and killing an arthropod while holding it fires the hit and kill effects. Estudinae's Sorrow no longer triggers them.
- [ ] Chainsaw: holding it in the main hand grants haste 2 once, and clears when put away. No unknown predicate errors in the log.
- [ ] Quet Zala's Beloved: with another mob wearing an Unbreaking chestplate nearby, a player without Unbreaking still takes the always-damage path.
- [ ] War Hog's Disdainful Pride: boots with Unbreaking use the Unbreaking durability odds on a fall.
- [ ] Datapack zip built with `build.ps1` does not contain the `docs/` folder.

## Not yet testable (later phases)


- Variants with their own `item_model` (phase 7).
