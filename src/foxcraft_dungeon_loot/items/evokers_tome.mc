import ../../macros.mcm

function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:41,CustomModelData:421951,display:{Name:'[{"text":"Evoker\'s Tome","italic":false,"color":"green"}]',Lore:['[{"text":"What Foul Magicks Dwell Within...?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green","italic":true},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Jaw Trap:","italic":false,"color":"green"},{"text":" ","color":"dark_purple"},{"text":"Summons a line of Evoker Fangs in","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"the direction you are looking.","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Sharknado:","italic":false,"color":"green"},{"text":" ","color":"dark_purple"},{"text":"While crouched, summons a whirling","color":"gray"}]','[{"text":"frenzy of ","italic":false,"color":"gray"},{"text":"Evoker Fangs centered on your","italic":false,"color":"gray"}]','[{"text":"current position.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}]} 1
}

function on_load {
    scoreboard objectives add satyrn.fdl.evokersTome.cooldown dummy
    scoreboard objectives add satyrn.fdl.evokersTome.spawnerLife dummy
    scoreboard objectives add satyrn.fdl.evokersTome.fangLife dummy
}

function on_tick {
    # Execute if the sender is holding the Evoker's Tome in their main hand.
    execute (if score @s satyrn.fdl.itemId.mainHand matches 41) {
        execute (if score @s satyrn.fdl.evokersTome.cooldown matches 1) {
            summon minecraft:armor_stand ^ ^ ^1 {Invisible:<%config.dev?0:1%>b,NoGravity:1b,Small:1b,Tags:[satyrn.fdl.evokerFangs,satyrn.fdl.fangBeam,satyrn.fdl.fangSpawn]}
            playsound foxcraft_dungeon_loot:entity.player.cast_spell player @s ~ ~ ~ 0.5 1

            execute (if entity @s[nbt=!{playerGameType:1}]) {
                item modify entity @s weapon.mainhand foxcraft_dungeon_loot:evokers_tome/damage_jaw_trap
                execute (if entity @s[nbt={SelectedItem:{tag:{Damage:100}}}]) {
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421951}
                }
            }

        } else execute(if score @s satyrn.fdl.evokersTome.cooldown matches 100) {
            summon minecraft:armor_stand ~ ~2 ~ {Invisible:<%config.dev?0:1%>b,NoGravity:1b,Small:1b,Tags:[satyrn.fdl.evokerFangs,satyrn.fdl.fangPivot]}
            playsound foxcraft_dungeon_loot:entity.player.cast_spell player @s ~ ~ ~ 0.5 1

            execute (if entity @s[nbt=!{playerGameType:1}]) {
                item modify entity @s weapon.mainhand foxcraft_dungeon_loot:evokers_tome/damage_sharknado
                execute (if entity @s[nbt={SelectedItem:{tag:{Damage:100}}}]) {
                    macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421951}
                }
            }
        }
    }

    # Increment cooldown timer.
    execute (if score @s satyrn.fdl.evokersTome.cooldown matches 1..) {
        scoreboard players add @s satyrn.fdl.evokersTome.cooldown 1
    }

    # Reset the cooldown timer at 2 seconds (offset by 0t) and 5 seconds (offset by 100t).
    execute (if score @s satyrn.fdl.evokersTome.cooldown matches 40) {
        function foxcraft_dungeon_loot:items/evokers_tome/reset_cooldown
    } else execute (if score @s satyrn.fdl.evokersTome.cooldown matches 200) {
        function foxcraft_dungeon_loot:items/evokers_tome/reset_cooldown
    }

    # We want to check if the player is using the Evoker's Tome after the cooldown has incremented since processing is
    # offset into the next tick.
    execute (if score @s satyrn.fdl.itemId.mainHand matches 41 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1..) {
        execute (unless score @s satyrn.fdl.evokersTome.cooldown matches 1..) {
            # Since the cooldown timer is incremented in the same tick,
            execute (if score @s satyrn.fdl.custom.sneakTime matches 1..) {
                scoreboard players set @s satyrn.fdl.evokersTome.cooldown 100
                title @s actionbar {"text":"The Evoker's Tome is now on cooldown for 5 seconds.","color":"dark_purple"}
            } else {
                scoreboard players set @s satyrn.fdl.evokersTome.cooldown 1
                title @s actionbar {"text":"The Evoker's Tome is now on cooldown for 2 seconds.","color":"dark_purple"}
            }
        } else {
            playsound foxcraft_dungeon_loot:entity.player.spell_fails player @s ~ ~ ~ 0.5 1
            title @s actionbar {"text":"The Evoker's Tome is on cooldown and cannot be used.","color":"dark_purple"}
        }
    }

    # Now we process the entities created by the Evoker's Tome. Warning for use of @e selection!
    # Since scoreboards are set on entities, using PaperMC with "entities on scoreboard" disabled
    #    is not supported for this item.

    # Process fang beams. This is the default activation mode for the item.
    execute (if entity @e[tag=satyrn.fdl.fangBeam] as @e[tag=satyrn.fdl.fangBeam] at @s) {
        scoreboard players add @s satyrn.fdl.evokersTome.spawnerLife 1
        execute (if score @s satyrn.fdl.evokersTome.spawnerLife matches 1) {
            data modify entity @s Rotation set from entity @p[scores={satyrn.fdl.evokersTome.cooldown=1..}] Rotation
            tp @s ~ ~1.7 ~
        } else execute (if score @s satyrn.fdl.evokersTome.spawnerLife matches 2..) {
            tp @s ^ ^ ^1
            # Fang beam extends outwards for 15 ticks
            execute if score @s satyrn.fdl.evokersTome.spawnerLife matches 15.. run kill @s
        }
    }

    # Process the fang pivot for the fang area attack.
    execute (if entity @e[tag=satyrn.fdl.fangPivot] as @e[tag=satyrn.fdl.fangPivot] at @s) {
        scoreboard players add @s satyrn.fdl.evokersTome.spawnerLife 1
        execute (if score @s satyrn.fdl.evokersTome.spawnerLife matches 2) {
            summon minecraft:armor_stand ~5 ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1,Tags:[satyrn.fdl.fangSpawn,satyrn.fdl.circleFang,satyrn.fdl.fangLead]}
            summon minecraft:armor_stand ~4 ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1,Tags:[satyrn.fdl.fangSpawn,satyrn.fdl.circleFang,satyrn.fdl.fang4]}
            summon minecraft:armor_stand ~3 ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1,Tags:[satyrn.fdl.fangSpawn,satyrn.fdl.circleFang,satyrn.fdl.fang3]}
            summon minecraft:armor_stand ~4 ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1,Tags:[satyrn.fdl.fangSpawn,satyrn.fdl.circleFang,satyrn.fdl.fang2]}
        }

        tp @s ~ ~ ~ facing entity @e[tag=satyrn.fdl.fangLead,limit=1,sort=nearest] feet
        execute at @s run {
            tp @e[tag=satyrn.fdl.fangLead,limit=1,sort=nearest] ^2 ^ ^5
            tp @e[tag=satyrn.fdl.fang4,limit=1,sort=nearest] ^4 ^ ^
            tp @e[tag=satyrn.fdl.fang3,limit=1,sort=nearest] ^ ^ ^-3
            tp @e[tag=satyrn.fdl.fang2,limit=1,sort=nearest] ^-2 ^ ^
        }

        execute if score @s satyrn.fdl.evokersTome.spawnerLife matches 40.. run kill @s

        execute (if entity @e[tag=satyrn.fdl.circleFang] as @e[tag=satyrn.fdl.circleFang] at @s) {
            scoreboard players add @s satyrn.fdl.evokersTome.spawnerLife 1
            execute if entity @e[type=minecraft:evoker_fangs,distance=1..5] run data modify entity @e[type=minecraft:evoker_fangs,limit=1,sort=nearest] Silent set value 1b
            execute if score @s satyrn.fdl.evokersTome.spawnerLife matches 35.. run kill @s
        }
    }
    execute if entity @e[tag=satyrn.fdl.fang] run scoreboard players add @e[tag=satyrn.fdl.fang] satyrn.fdl.evokersTome.fangLife 1

    # Spawn the armor stand marker for the evoker fangs
    execute if entity @e[tag=satyrn.fdl.fangSpawn] as @e[tag=satyrn.fdl.fangSpawn] at @s if score @s satyrn.fdl.evokersTome.spawnerLife matches 2.. run summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Silent:1b,Small:1b,Tags:[satyrn.fdl.evokerFangs,satyrn.fdl.fang],Motion:[0.0,-10.0,0.0]}

    # Spawn the evoker fangs
    execute (if entity @e[tag=satyrn.fdl.fang] as @e[tag=satyrn.fdl.fang] at @s) {
        execute (if entity @s[nbt={OnGround:1b}] if score @s satyrn.fdl.evokersTome.fangLife matches 1) {
            summon minecraft:evoker_fangs ~ ~ ~ {Tags:[satyrn.fdl.playerEvokerFang]}
            execute as @e[tag=satyrn.fdl.playerEvokerFang,type=minecraft:evoker_fangs,limit=1,sort=nearest] at @s run {
                data modify entity @s Owner set from entity @p[scores={satyrn.fdl.evokersTome.cooldown=1..}] UUID
                tag @s remove satyrn.fdl.playerEvokerFang
            }
        }
        execute if score @s satyrn.fdl.evokersTome.fangLife matches 1.. run kill @s
    }
}

function reset_cooldown {
    macro cooldown_complete
    title @s actionbar {"text":"The Evoker's Tome is ready to use once more.","color":"dark_purple"}
    scoreboard players reset @s satyrn.fdl.evokersTome.cooldown
}