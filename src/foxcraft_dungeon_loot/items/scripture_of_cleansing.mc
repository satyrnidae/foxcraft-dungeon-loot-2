import ../../macros.mcm

# Summons a particle every ten ticks
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/scripture_of_cleansing/clock_10t 10t
    execute as @a at @s run {
        execute (if score @s satyrn.fdl.itemId.mainHand matches 51) {
            particle minecraft:enchant ~ ~1 ~ 0.5 0.5 0.5 0.0 1
        }
    }
}

# Starts the clock function with a 2 tick offset and creates the cooldown timer
function on_load {
    schedule function foxcraft_dungeon_loot:items/scripture_of_cleansing/clock_10t 2t
    scoreboard objectives add satyrn.fdl.scriptureOfCleansing.cooldown dummy
}

# Executes once per player per tick
function on_tick {
    # Increment tick timer
    execute as @a[scores={satyrn.fdl.scriptureOfCleansing.cooldown=1..}] run {
        scoreboard players add @s satyrn.fdl.scriptureOfCleansing.cooldown 1

        # Reset scoreboard after 30 seconds.
        execute at @s[scores={satyrn.fdl.scriptureOfCleansing.cooldown=600..}] run {
            playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
            particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
            title @s actionbar {"text":"The Scripture of Cleansing is ready to be used once more.","color":"dark_purple"}
            scoreboard players reset @s satyrn.fdl.scriptureOfCleansing.cooldown
        }
    }
}

# Runs when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.scriptureOfCleansing.cooldown
}

# Runs when the player uses a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/scripture_of_cleansing/in_main_hand] run {
        execute (if score @s satyrn.fdl.scriptureOfCleansing.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5
            title @s actionbar {"text":"The Scripture of Cleansing is on cooldown and cannot be used.","color":"dark_purple"}
        } else {
            summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1b,Invulnerable:1b,NoGravity:1b,Tags:[satyrn.fdl.cleaner]}

            # Who's ready for an awful horrible no good nested if statement...
            execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:-106b}].tag.Enchantments[{id:"minecraft:vanishing_curse"}]
            execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                # This macro runs in context of the armor stand and does all the fun item transfers, sounds, and particle effects.
                macro remove_enchantment weapon.offhand minecraft:vanishing_curse
                tellraw @p {"text":"The Scripture of Cleansing removed the Vanishing curse from your offhand item.","color":"gray","italic":true}
            } else {
                execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:-106b}].tag.Enchantments[{id:"minecraft:binding_curse"}]
                execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                    macro remove_enchantment weapon.offhand minecraft:binding_curse
                    tellraw @p {"text":"The Scripture of Cleansing removed the Binding curse from your offhand item.","color":"gray","italic":true}
                } else {
                    execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:103b}].tag.Enchantments[{id:"minecraft:vanishing_curse"}]
                    execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                        macro remove_enchantment armor.head minecraft:vanishing_curse
                        tellraw @p {"text":"The Scripture of Cleansing removed the Vanishing curse from your helmet.","color":"gray","italic":true}
                    } else {
                        execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:103b}].tag.Enchantments[{id:"minecraft:binding_curse"}]
                        execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                            macro remove_enchantment armor.head minecraft:binding_curse
                            tellraw @p {"text":"The Scripture of Cleansing removed the Binding curse from your helmet.","color":"gray","italic":true}
                        } else {
                            execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:102b}].tag.Enchantments[{id:"minecraft:vanishing_curse"}]
                            execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                                macro remove_enchantment armor.chest minecraft:vanishing_curse
                                tellraw @p {"text":"The Scripture of Cleansing removed the Vanishing curse from your chestplate.","color":"gray","italic":true}
                            } else {
                                execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:102b}].tag.Enchantments[{id:"minecraft:binding_curse"}]
                                execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                                    macro remove_enchantment armor.chest minecraft:binding_curse
                                    tellraw @p {"text":"The Scripture of Cleansing removed the Binding curse from your chestplate.","color":"gray","italic":true}
                                } else {
                                    # This is gonna be basically impossible for anyone only looking at the generated datapack to decipher, isn't it.
                                    execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:101b}].tag.Enchantments[{id:"minecraft:vanishing_curse"}]
                                    execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                                        macro remove_enchantment armor.legs minecraft:vanishing_curse
                                        tellraw @p {"text":"The Scripture of Cleansing removed the Vanishing curse from your leggings.","color":"gray","italic":true}
                                    } else {
                                        execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:101b}].tag.Enchantments[{id:"minecraft:binding_curse"}]
                                        execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                                            macro remove_enchantment armor.legs minecraft:binding_curse
                                            tellraw @p {"text":"The Scripture of Cleansing removed the Binding curse from your leggings.","color":"gray","italic":true}
                                        } else {
                                            execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:100b}].tag.Enchantments[{id:"minecraft:vanishing_curse"}]
                                            execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                                                macro remove_enchantment armor.feet minecraft:vanishing_curse
                                                tellraw @p {"text":"The Scripture of Cleansing removed the Vanishing curse from your boots.","color":"gray","italic":true}
                                            } else {
                                                execute store success score #test <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:100b}].tag.Enchantments[{id:"minecraft:binding_curse"}]
                                                execute (if score #test <%config.internalScoreboard%> matches 1 as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest]) {
                                                    macro remove_enchantment armor.feet minecraft:binding_curse
                                                    tellraw @p {"text":"The Scripture of Cleansing removed the Binding curse from your boots.","color":"gray","italic":true}
                                                } else {
                                                    # Now we scan general inventory for vanishing items (┬┬﹏┬┬)
                                                    data remove storage foxcraft_dungeon_loot:scripture_of_cleansing SlotScan
                                                    data modify storage foxcraft_dungeon_loot:scripture_of_cleansing SlotScan append from entity @s Inventory[{tag:{Enchantments:[{id:"minecraft:vanishing_curse"}]}}].Slot
                                                    execute store success score #test <%config.internalScoreboard%> run data get storage foxcraft_dungeon_loot:scripture_of_cleansing SlotScan[0]
                                                    execute (if score #test <%config.internalScoreboard%> matches 1) {
                                                        execute store result score #test <%config.internalScoreboard%> run data get storage foxcraft_dungeon_loot:scripture_of_cleansing SlotScan[0]
                                                        !IF(config.dev) {
                                                            tellraw @s ["",{"text": "Found an item with vanishing in slot "},{"score":{"name":"#test","objective":"<%config.internalScoreboard%>"}},{"text":"."}]
                                                        }
                                                        # Get ready to loop THIRTY SIX TIMES.
                                                        LOOP(36,i) {
                                                            execute if score #test <%config.internalScoreboard%> matches <%i%> as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest] run {
                                                                macro remove_enchantment container.<%i%> minecraft:vanishing_curse
                                                                tellraw @p {"text":"The Scripture of Cleansing removed the Vanishing curse from an item in your inventory.","color":"gray","italic":true}
                                                                scoreboard players set #test <%config.internalScoreboard%> 1
                                                            }
                                                        }
                                                    } else {
                                                        # ヽ(*。>Д<)o゜
                                                        data remove storage foxcraft_dungeon_loot:scripture_of_cleansing SlotScan
                                                        data modify storage foxcraft_dungeon_loot:scripture_of_cleansing SlotScan append from entity @s Inventory[{tag:{Enchantments:[{id:"minecraft:binding_curse"}]}}].Slot
                                                        execute store success score #test <%config.internalScoreboard%> run data get storage foxcraft_dungeon_loot:scripture_of_cleansing SlotScan[0]
                                                        execute if score #test <%config.internalScoreboard%> matches 1 run {
                                                            execute store result score #test <%config.internalScoreboard%> run data get storage foxcraft_dungeon_loot:scripture_of_cleansing SlotScan[0]
                                                            !IF(config.dev) {
                                                                tellraw @s ["",{"text": "Found an item with binding in slot "},{"score":{"name":"#test","objective":"<%config.internalScoreboard%>"}},{"text":"."}]
                                                            }
                                                            # Get ready to loop THIRTY SIX TIMES... AGAIN!!!
                                                            LOOP(36,i) {
                                                                execute if score #test <%config.internalScoreboard%> matches <%i%> as @e[tag=satyrn.fdl.cleaner,limit=1,sort=nearest] run {
                                                                    macro remove_enchantment container.<%i%> minecraft:binding_curse
                                                                    tellraw @p {"text":"The Scripture of Cleansing removed the Binding curse from an item in your inventory.","color":"gray","italic":true}
                                                                    scoreboard players set #test <%config.internalScoreboard%> 1
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            kill @e[type=minecraft:armor_stand,tag=satyrn.fdl.cleaner,limit=1,sort=nearest]
            execute (if score #test <%config.internalScoreboard%> matches 1) {
                playsound foxcraft_dungeon_loot:entity.player.cast_wololo player @a
                particle minecraft:enchanted_hit ~ ~1 ~ 0.5 0.5 0.5 1.0 10
                summon minecraft:experience_orb ~ ~ ~ {Value:6}
            } else {
                playsound minecraft:block.fire.extinguish player @a ~ ~ ~ 1.0 2.0
                particle minecraft:smoke ^ ^1.5 ^0.5 0.05 0.05 0.05 0 5 normal @s
                tellraw @s {"text":"The Scripture of Cleansing was unable to uncurse any of your items.","color":"gray","italic":true}
            }

            # Really banking on #test's value in the internal scoreboard being set to 1 or 0 at this point :)
            execute unless entity @s[gamemode=creative] run {
                execute (if score #test <%config.internalScoreboard%> matches 1) {
                    # 4/21/95 is my birthday btw, if you were wondering why I used that number. Why did I put this here? This function has broken me (:
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421953}
                } else {
                    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:scripture_of_cleansing/damage_failure
                    execute if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_broken] run {
                        # 19950421 was too large a number to prepend or I would have gone with the ISO date format. Curse you single-precision floating point limitations!!!
                        macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421953}
                    }
                }
                scoreboard players set @s satyrn.fdl.scriptureOfCleansing.cooldown 1
                title @s actionbar {"text":"The Scripture of Cleansing is now on cooldown for 30 seconds.","color":"dark_purple"}
            }
        }
    }
}
