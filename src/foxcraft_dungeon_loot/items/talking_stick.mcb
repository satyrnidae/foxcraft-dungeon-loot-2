###

TAGS USED

satyrn.fdl.talkingStick.effectsApplied - Added to a player alongside the item's effects; can be used to tell which players have the item's effects.

###

# Occurs once per player per tick
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/talking_stick/clock_10t 10t

    execute as @a[tag=satyrn.fdl.talkingStick.effectsApplied,predicate=!foxcraft_dungeon_loot:items/talking_stick/in_off_hand] run {
        effect clear @s minecraft:haste
        effect clear @s minecraft:resistance
        effect clear @s minecraft:night_vision
        effect clear @s minecraft:glowing
        tag @s remove satyrn.fdl.talkingStick.effectsApplied
    }

    execute as @a[predicate=foxcraft_dungeon_loot:items/talking_stick/in_off_hand,predicate=!foxcraft_dungeon_loot:items/talking_stick/has_effects] run {
        effect give @s minecraft:haste 1000000 1
        effect give @s minecraft:resistance 1000000 1
        effect give @s minecraft:night_vision 1000000
        effect give @s minecraft:glowing 1000000
        tag @s add satyrn.fdl.talkingStick.effectsApplied
    }
}

# Runs when the datapack loads
function on_load {
    schedule function foxcraft_dungeon_loot:items/talking_stick/clock_10t 9t
}
