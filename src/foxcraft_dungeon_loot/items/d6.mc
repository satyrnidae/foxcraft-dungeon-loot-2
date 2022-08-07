import ../../macros.mcm

# Occurs once per tick.
function on_tick {
    execute as @a[predicate=foxcraft_dungeon_loot:items/d6/in_main_hand,predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use,scores={satyrn.fdl.used.warpedFungusOnAStick=1..}] at @s run {
        playsound foxcraft_dungeon_loot:item.dice.d6 player @a

        macro random 1 6

        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#random","objective":"<%config.internalScoreboard%>"}}]
    }
}
