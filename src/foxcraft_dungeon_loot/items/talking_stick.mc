import ../../macros.mcm

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 53) {
        execute unless entity @s[predicate=foxcraft_dungeon_loot:items/talking_stick/has_effects] run {
            effect give @s minecraft:haste 1000000 1
            effect give @s minecraft:resistance 1000000 3
            effect give @s minecraft:night_vision 1000000
            effect give @s minecraft:glowing 1000000
        }
    } else execute (if entity @s[tag=satyrn.fdl.talkingStick.effectsApplied]) {
        effect clear @s minecraft:haste
        effect clear @s minecraft:resistance
        effect clear @s minecraft:night_vision
        effect clear @s minecraft:glowing
        tag @s remove satyrn.fdl.talkingStick.effectsApplied
    }
}
