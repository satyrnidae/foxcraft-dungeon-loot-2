import ../../macros.mcm

# Gives the sender a copy of the Downpour Amulet item.
function give {
    macro give_as_loot mythic/downpour_amulet
}

# Initializes the Downpour Amulet's cooldown scoreboard.
function on_load {
    scoreboard objectives add satyrn.fdl.downpourAmulet.cooldown dummy
}

# Handles events for the item. Executes every tick. Be extra mindful of NBT scans!
# Executed in the context and at the location of a single player.
function on_tick {
    execute if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 37 run {
        execute (if score @s satyrn.fdl.downpourAmulet.cooldown matches 1..) {
            # Warn the player that the item cooldown is currently active.
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"The Downpour Amulet is currently on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            playsound foxcraft_dungeon_loot:entity.player.cast_wololo player @a
            playsound minecraft:entity.lightning_bolt.thunder weather @a ~ ~ ~ 6.0
            playsound minecraft:entity.lightning_bolt.thunder weather @a ~ ~ ~ 0 1 0.75
            particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 1.0 10 normal @s

            # If the sender is crouching, set the weather to thunder. Otherwise, set it to rain.
            execute (if score @s satyrn.fdl.custom.sneakTime matches 1..) {
                weather thunder 300
                tellraw @a ["[",{"selector":"@s"},"] ",{"text":"Set the weather to Thunder for 5 minutes.","italic":true}]
            } else {
                weather rain 300
                tellraw @a ["[",{"selector":"@s"},"] ",{"text":"Set the weather to Rain for 5 minutes.","italic":true}]
            }

            # Set cooldown, damage, and potentially break the item for non-creative players.
            execute unless entity @s[gamemode=creative] run {
                scoreboard players set @s satyrn.fdl.downpourAmulet.cooldown 1
                title @s actionbar {"text":"The Downpour Amulet is now on cooldown for 5 minutes.","color":"dark_purple"}
                execute (if score @s satyrn.fdl.custom.sneakTime matches 1..) {
                    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:downpour_amulet/damage_thunder
                } else {
                    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:downpour_amulet/damage_rain
                }

                # Break item if damage is maxed out.
                execute if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_broken] run {
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421954}
                }
            }
        }
    }
    # Increment cooldown timer
    execute if score @s satyrn.fdl.downpourAmulet matches 1.. run scoreboard players add @s satyrn.fdl.downpourAmulet.cooldown 100

    # Reset cooldown after 5 minutes
    execute if score @s satyrn.fdl.downpourAmulet.cooldown matches 6000.. run {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"The Downpour Amulet is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.downpourAmulet.cooldown
    }
}
