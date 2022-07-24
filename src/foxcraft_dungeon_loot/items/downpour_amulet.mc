import ../../macros.mcm

# Gives the sender a copy of the Downpour Amulet item.
function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:37,CustomModelData:421954,display:{Name:'[{"text":"Downpour Amulet","italic":false,"color":"green"}]',Lore:['[{"text":"Make it rain.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green","italic":true},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Drizzle:","italic":false,"color":"light_purple"},{"text":" ","color":"dark_purple"},{"text":"When used, summons a rainstorm","color":"gray"}]','[{"text":"for five minutes.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"  ","italic":false,"color":"dark_purple"},{"text":"- ","color":"gray"},{"text":"Durability is decreased by 4%.","color":"red"},{"text":"","color":"dark_purple"}]','[{"text":"Downpour:","italic":false,"color":"green"},{"text":" ","color":"dark_purple"},{"text":"When used while crouching,","color":"gray"}]','[{"text":"summons a thunderstorm for five minutes.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"  ","italic":false,"color":"red"},{"text":"- ","color":"gray"},{"text":"Durability is decreased by 13%."}]']},Enchantments:[{id:"minecraft:mending",lvl:1}]} 1
}

# Initializes the Downpour Amulet's cooldown scoreboard.
function on_load {
    scoreboard objectives add satyrn.fdl.downpourAmulet.cooldown dummy
}

# Handles events for the item. Executes every tick. Be extra mindful of NBT scans!
# Executed in the context and at the location of a single player.
function on_tick {
    execute (if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fd.itemId.mainHand matches 37) {
        execute (unless score @s satyrn.fdl.downpourAmulet.cooldown matches 1..) {
            playsound minecraft:entity.evoker.prepare_wololo player @s ~ ~ ~ 100.0
            particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 1.0 10 normal @s

            # If the sender is crouching, set the weather to thunder. Otherwise, set it to rain.
            execute (if score @s satyrn.fdl.custom.sneakTime matches 1..) {
                weather thunder 300
                say {"text":"Set the weather to Thunder for 5 minutes.","italic":true}
            } else {
                weather rain 300
                say {"text":"Set the weather to Rain for 5 minutes.","italic":true}
            }

            # Set cooldown, damage, and potentially break the item for non-creative players.
            execute (if entity @s[nbt=!{playerGameType:1}]) {
                scoreboard players set @s satyrn.fdl.downpourAmulet.cooldown 1
                title @s actionbar {"text":"The Downpour Amulet is now on cooldown for 5 minutes.","color":"dark_purple"}
                execute (if score satyrn.fdl.custom.sneakTime matches 1..) {
                    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:downpour_amulet/damage_thunder
                } else {
                    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:downpour_amulet/damage_rain
                }

                # Break item if damage is maxed out.
                execute (if entity @s[nbt={SelectedItem:{tag:{Damage:100}}}]) {
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421954}
                }
            }
        } else {
            # Warn the player that the item cooldown is currently active.
            playsound minecraft:entity.evoker.prepare_summon player @s ~ ~ ~ 0.5 1
            title @s actionbar {"text":"The Downpour Amulet is currently on cooldown and cannot be used.","color":"dark_purple"}
        }
    }
    # Increment cooldown timer
    execute (if score @s satyrn.fdl.downpourAmulet matches 1..) {
        scoreboard players add @s satyrn.fdl.downpourAmulet.cooldown 1
    }
    # Reset cooldown after 5 minutes
    execute (if score @s satyrn.fdl.downpourAmulet.cooldown matches 6000) {
        macro cooldown_complete
        title @s actionbar {"text":"The Downpour Amulet is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.downpourAmulet.cooldown
    }
}