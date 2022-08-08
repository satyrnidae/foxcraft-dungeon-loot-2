# Runs when the datapack is loaded
function on_load {
    scoreboard objectives add satyrn.fdl.silverfishEscapeArtist.cooldown dummy
}

# Runs once per tick
function on_tick {
    execute as @a[scores={satyrn.fdl.silverfishEscapeArtist.cooldown=1..}] run {
        scoreboard players add @s satyrn.fdl.silverfishEscapeArtist.cooldown 1

        execute at @s[scores={satyrn.fdl.silverfishEscapeArtist.cooldown=600..}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"Silverfish Escape Artist is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.silverfishEscapeArtist.cooldown
        }
    }
}

# Runs when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.silverfishEscapeArtist.cooldown
}

# Runs when a player uses a warped fungus on a stick
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/silverfish_escape_artist/in_main_hand] run {
        execute (if score @s satyrn.fdl.silverfishEscapeArtist.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"Silverfish Escape Artist is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            playsound minecraft:entity.generic.eat player @a
            playsound minecraft:entity.player.burp player @a
            particle minecraft:item minecraft:warped_fungus_on_a_stick{CustomModelData:4219510} ^ ^1.25 ^0.5 0 0.5 0.5 0.1 8

            effect give @s minecraft:saturation 3 0 true
            effect give @s minecraft:speed 30 3
            effect give @s minecraft:mining_fatigue 30
            effect give @s minecraft:jump_boost 30
            effect give @s minecraft:regeneration 30
            effect give @s minecraft:water_breathing 30
            effect give @s minecraft:invisibility 30
            effect give @s minecraft:night_vision 30
            effect give @s minecraft:weakness 30
            effect give @s minecraft:absorption 30
            effect give @s minecraft:glowing 30
            effect give @s minecraft:luck 30
            effect give @s minecraft:slow_falling 30
            effect give @s minecraft:hunger 30 2

            execute unless entity @s[gamemode=creative] run {
                scoreboard players add @s satyrn.fdl.silverfishEscapeArtist.cooldown 1
                title @s actionbar {"text":"Silverfish Escape Artist is now on cooldown for 30 seconds.","color":"dark_purple"}
                item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
            }
        }
    }
}
