import ../../macros.mcm

function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:48,CustomModelData:421950,AttributeModifiers:[{AttributeName:"generic.max_health",Amount:4,Slot:chest,Name:"generic.max_health",UUID:[I;-122620,36037,171513,-72074]}],display:{Name:'[{"text":"Poncho Sanchez\'s Fate","italic":false,"color":"green"}]',Lore:['[{"text":"The arrival of Poncho Sanchez was preceded by"}]','[{"text":"the baleful wail of his horn.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity:","italic":true},{"text":" Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"The Roar of Poncho Sanchez:","italic":false,"color":"green"},{"text":" When blown, sounds","italic":false,"color":"gray"}]','[{"text":"a random goat horn and applies a bevy of","italic":false,"color":"gray"}]','[{"text":"effects.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}]} 1
}

function on_load {
    scoreboard objectives add satyrn.fdl.ponchoSanchezsFate.cooldown dummy
}

function on_tick {
    # Executes this block if the user has used Poncho Sanchez's Fate
    execute (if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 48) {
        execute (unless score @s satyrn.fdl.ponchoSanchezsFate.cooldown matches 1..) {
            macro random 1 9

            LOOP(8,i) {
                execute if score #random <%config.internalScoreboard%> matches <%i%> run playsound minecraft:item.goat_horn.sound.<%i%> ambient @s ~ ~ ~ 100.0 1.0
            }
            execute if score #random <%config.internalScoreboard%> matches 9 run playsound minecraft:event.raid.horn ambient @s ~ ~ ~ 100.0 1.0

            execute as @e[type=!#foxcraft_dungeon_loot:non_living,type=!#foxcraft_dungeon_loot:hostile,distance=..100] run {
                effect give @s minecraft:slow_falling 180
                effect give @s minecraft:speed 180
                effect give @s minecraft:resistance 180
                effect give @s minecraft:hunger 60
                effect give @s minecraft:nausea 10
                effect give @s minecraft:saturation 3 1
                effect give @s minecraft:absorption 60 1
            }

            execute (unless entity @s[nbt={playerGameType:1}]) {
                scoreboard players set @s satyrn.fdl.ponchoSanchezsFate.cooldown 1
                title @s actionbar {"text":"Poncho Sanchez's Fate is now on cooldown for 5 minutes.","color":"dark_purple"}

                item modify entity @s weapon.mainhand foxcraft_dungeon_loot:poncho_sanchezs_fate/damage

                execute (if entity @s[nbt={SelectedItem:{tag:{Damage:100}}}]) {
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421950}
                }
            }
        } else {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 1.0 1.0
            title @s actionbar {"text":"Poncho Sanchez's Fate is on cooldown and cannot be used.","color":"dark_purple"}
        }
    }

    # Increments the cooldown timer
    execute if score @s satyrn.fdl.ponchoSanchezsFate.cooldown matches 1.. run scoreboard players add @s satyrn.fdl.ponchoSanchezsFate.cooldown 1

    execute (if score @s satyrn.fdl.ponchoSanchezsFate.cooldown matches 6000..) {
        playsound foxcraft_dungeon_loot:entity.player.spell_ready player @s ~ ~ ~ 0.5 1
        particle minecraft:witch ~ ~1 ~ 0 0.5 0 1 10 normal @s
        title @s actionbar {"text":"Poncho Sanchez's Fate is ready to be used once more.","color":"dark_purple"}
        scoreboard players reset @s satyrn.fdl.ponchoSanchezsFate.cooldown
    }
}
