import ../../macros.mcm

function clock_10t {
    schedule function foxcraft_dungeon_loot:items/scripture_of_cleansing/clock_10t 10t
    execute as @a at @s run {
        execute (if score @s satyrn.fdl.itemId.mainHand matches 51) {
            particle minecraft:enchant ~ ~1 ~ 0.5 0.5 0.5 0.0 1
        } else execute (if score @s satyrn.fdl.itemId.offHand matches 51) {
            particle minecraft:enchant ~ ~1 ~ 0.5 0.5 0.5 0.0 1
        }
    }
}

function give {
    give @p minecraft:warped_fungus_on_a_stick{DungeonLootId:51,CustomModelData:421953,display:{Name:'[{"text":"Scripture of Cleansing","italic":false,"color":"green"}]',Lore:['[{"text":"Approach, ye Blasted Souls, and be Cleansed."}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"green","italic":false}]','[{"text":"","italic":false,"color":"green"}]','[{"text":"Cleansing Ritual:","italic":false,"color":"green"},{"text":" When used, an item that","italic":false,"color":"gray"}]','[{"text":"you are either holding or wearing will be","italic":false,"color":"gray"}]','[{"text":"cleansed of either Curse of Vanishing or","italic":false,"color":"gray"}]','[{"text":"Curse of Binding. If no cursed item is found,","italic":false,"color":"gray"}]','[{"text":"the Scripture is not consumed.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Fragile:","italic":false,"color":"red"},{"text":" This item is consumed when","italic":false,"color":"gray"}]','[{"text":"Cleansing Ritual is used to successfully","italic":false,"color":"gray"}]','[{"text":"cleanse a cursed item.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
}

function on_load {
    # Start clock with a 9 tick offset
    schedule function foxcraft_dungeon_loot:items/scripture_of_cleansing/clock_10t 9t
    scoreboard objectives add satyrn.fdl.scriptureOfCleansing.cooldown dummy
}

function on_tick {
    execute (if score @s satyrn.fdl.itemId.mainHand matches 51 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1..) {
        execute (if score @s satyrn.fdl.scriptureOfCleansing.cooldown matches 1..) {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 1.0
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
                summon minecraft:experience_orb ~ ~ ~ {Value:6}
            } else {
                playsound minecraft:block.fire.extinguish player @s ~ ~ ~ 1.0 2.0
                particle minecraft:smoke ^ ^1.5 ^0.5 0.05 0.05 0.05 0 5 normal @s
                tellraw @s {"text":"The Scripture of Cleansing was unable to uncurse any of your items.","color":"gray","italic":true}
            }

            # Really banking on #test's value in the internal scoreboard being set to 1 or 0 at this point :)
            execute unless entity @s[nbt={playerGameType:1}] run {
                execute (if score #test <%config.internalScoreboard%> matches 1) {
                    # 4/21/95 is my birthday btw, if you were wondering why I used that number. Why did I put this here? This function has broken me :)))))
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421953}
                } else {
                    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:scripture_of_cleansing/damage_failure
                    execute if entity @s[nbt={SelectedItem:{tag:{Damage:100}}}] run {
                        # 19950421 was too large a number to prepend or I would have gone with the ISO date format. Curse you single-precision floating point limitations!!!
                        macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421953}
                    }
                }
                scoreboard players set @s satyrn.fdl.scriptureOfCleansing.cooldown 1
                title @s actionbar {"text":"The Scripture of Cleansing is now on cooldown for 30 seconds.","color":"dark_purple"}
            }
        }
    }

    # Increment tick timer
    execute if score @s satyrn.fdl.scriptureOfCleansing.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.scriptureOfCleansing.cooldown 1

    # Reset scoreboard after 30 seconds.
    execute if score @s satyrn.fdl.scriptureOfCleansing.cooldown matches 600 run {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"The Scripture of Cleansing is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.scriptureOfCleansing.cooldown
    }
}
