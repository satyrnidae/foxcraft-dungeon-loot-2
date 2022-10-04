import ../../macros.mcm

# TAGS USED
# satyrn.fdl.warHogsBlightedHarvest.blightSource: A player who summoned a blight.
# satyrn.fdl.warHogsBlightedHarvest.harvesting: A player who harvested a crop.
# satyrn.fdl.warHogsBlightedHarvest.tilled: A player who tilled a block.

# Harvests a single crop block
function harvest_crop {
    execute align xyz positioned ~ ~1 ~ run {
        execute if block ~ ~ ~ minecraft:wheat[age=7] run setblock ~ ~ ~ minecraft:air destroy
        execute if block ~ ~ ~ minecraft:carrots[age=7] run setblock ~ ~ ~ minecraft:air destroy
        execute if block ~ ~ ~ minecraft:potatoes[age=7] run setblock ~ ~ ~ minecraft:air destroy
        execute if block ~ ~ ~ minecraft:beetroots[age=3] run setblock ~ ~ ~ minecraft:air destroy
        execute if block ~ ~ ~ minecraft:nether_wart[age=3] run setblock ~ ~ ~ minecraft:air destroy
    }
}

# Tills dirt
function till_dirt {
    execute align xyz if block ~ ~ ~ #foxcraft_dungeon_loot:tillable if block ~ ~1 ~ #foxcraft_dungeon_loot:air run setblock ~ ~ ~ minecraft:farmland replace
}

# Tills coarse dirt
function till_coarse_dirt {
     execute align xyz if block ~ ~ ~ minecraft:coarse_dirt run setblock ~ ~ ~ minecraft:dirt replace
}

# Harvests crop blocks in a circle around the block
function do_harvest {
    LOOP(5,x) {
        LOOP(5,z) {
            !IF(!((x==0 && z==0) || (x==0 && z==4) || (x==4 && z==0) || (x==4 && z==4))) {
                execute positioned ~<%x-2%> ~ ~<%z-2%> run function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/harvest_crop
            }
        }
    }
}

# Tills dirt in a circle around the block
function do_till {
    execute align xyz if block ~ ~ ~ minecraft:farmland run {
        LOOP(5,x) {
            LOOP(5,z) {
                !IF(!((x==0 && z==0) || (x==0 && z==4) || (x==4 && z==0) || (x==4 && z==4))) {
                    execute positioned ~<%x-2%> ~ ~<%z-2%> run {
                        function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/till_dirt
                    }
                }
            }
        }
    }
    execute align xyz if block ~ ~ ~ minecraft:dirt run {
        LOOP(5,x) {
            LOOP(5,z) {
                !IF(!((x==0 && z==0) || (x==0 && z==4) || (x==4 && z==0) || (x==4 && z==4))) {
                    execute positioned ~<%x-2%> ~ ~<%z-2%> run {
                        function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/till_coarse_dirt
                    }
                }
            }
        }
    }
}

# Occurs when the player harvests a crop.
function on_harvest {
    tag @s add satyrn.fdl.warHogsBlightedHarvest.harvesting
    function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/raycast/block/start
    tag @s remove satyrn.fdl.warHogsBlightedHarvest.harvesting
}

# Occurs when the player defeats an entity
function on_kill_entity {
    execute store result score @s satyrn.fdl.souls run data get entity @s SelectedItem.tag.Souls
    execute (if score @s satyrn.fdl.souls >= #10 <%config.internalScoreboard%>) {
        playsound minecraft:entity.player.attack.crit player @a
        playsound minecraft:particle.soul_escape player @a

        # Summon a short-lived area effect cloud to show the effect radius
        summon minecraft:area_effect_cloud ~ ~0.1 ~ {Duration:5,Color:16777215,Radius:10,Particle:"minecraft:soul"}

        execute (if score warHogsBlightedHarvest.pvp <%config.internalScoreboard%> matches 1..) {
            tag @s add satyrn.fdl.warHogsBlightedHarvest.blightSource
            execute as @e[type=!#foxcraft_dungeon_loot:non_player_ally,tag=!satyrn.fdl.warHogsBlightedHarvest.blightSource,predicate=!foxcraft_dungeon_loot:is_persistent,distance=..10] run effect give @s minecraft:wither 10 2
            tag @s remove satyrn.fdl.warHogsBlightedHarvest.blightSource
        } else {
            execute as @e[type=!#foxcraft_dungeon_loot:ally,tag=!satyrn.fdl.warHogsBlightedHarvest.blightSource,predicate=!foxcraft_dungeon_loot:is_persistent,distance=..10] run effect give @s minecraft:wither 10 2
        }

        scoreboard players operation @s satyrn.fdl.souls -= #10 <%config.internalScoreboard%>
        function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/update_soul_count
    } else {
        playsound minecraft:particle.soul_escape player @a
        particle minecraft:soul ^ ^1.5 ^0.5 0 0 0 0 0 force @s

        scoreboard players add @s satyrn.fdl.souls 1
        function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/update_soul_count
    }
    advancement revoke @s only foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/on_kill_entity
}

# Sets the soul count on the weapon to the
function update_soul_count {
    summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Small:1b,Invulnerable:1b,NoGravity:1b,Marker:1b,Tags:[satyrn.fdl.soulsIncrement]}
    execute as @e[tag=satyrn.fdl.soulsIncrement,sort=nearest,limit=1] run {
        item replace entity @s weapon.mainhand from entity @p weapon.mainhand
        execute store result entity @s HandItems[0].tag.Souls int 1 run scoreboard players get @p satyrn.fdl.souls
        item replace entity @p weapon.mainhand from entity @s weapon.mainhand
        item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        kill @s
    }

    item modify entity @s weapon.mainhand foxcraft_dungeon_loot:war_hogs_blighted_harvest/set_lore
}

# Called when the datapack is loaded or reloaded.
function on_load {
    scoreboard objectives add satyrn.fdl.warHogsBlightedHarvest.harvestWheat mined:wheat "Wheat Harvested"
    scoreboard objectives add satyrn.fdl.warHogsBlightedHarvest.harvestCarrots mined:carrots "Carrots Harvested"
    scoreboard objectives add satyrn.fdl.warHogsBlightedHarvest.harvestPotatoes mined:potatoes "Potatoes Harvested"
    scoreboard objectives add satyrn.fdl.warHogsBlightedHarvest.harvestBeetroots mined:beetroots "Beetroots Harvested"
    scoreboard objectives add satyrn.fdl.warHogsBlightedHarvest.harvestNetherWart mined:nether_wart "Nether Wart Harvested"

    scoreboard players set #10 <%config.internalScoreboard%> 10

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get warHogsBlightedHarvest.pvp <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set warHogsBlightedHarvest.pvp <%config.internalScoreboard%> 0
}

# Occurs each tick
function on_tick {
    execute as @a[predicate=foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/in_main_hand] run {
        execute (if score @s satyrn.fdl.warHogsBlightedHarvest.harvestWheat matches 1..) {
            function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/on_harvest
        } else execute (if score @s satyrn.fdl.warHogsBlightedHarvest.harvestCarrots matches 1..) {
            function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/on_harvest
        } else execute (if score @s satyrn.fdl.warHogsBlightedHarvest.harvestPotatoes matches 1..) {
            function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/on_harvest
        } else execute (if score @s satyrn.fdl.warHogsBlightedHarvest.harvestBeetroots matches 1..) {
            function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/on_harvest
        } else execute (if score @s satyrn.fdl.warHogsBlightedHarvest.harvestNetherWart matches 1..) {
            function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/on_harvest
        }
    }

    scoreboard players reset @a satyrn.fdl.warHogsBlightedHarvest.harvestWheat
    scoreboard players reset @a satyrn.fdl.warHogsBlightedHarvest.harvestCarrots
    scoreboard players reset @a satyrn.fdl.warHogsBlightedHarvest.harvestPotatoes
    scoreboard players reset @a satyrn.fdl.warHogsBlightedHarvest.harvestBeetroots
    scoreboard players reset @a satyrn.fdl.warHogsBlightedHarvest.harvestNetherWart
}

# Occurs when the player tills earth.
function on_till {
    tag @s add satyrn.fdl.warHogsBlightedHarvest.tilling
    function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/raycast/block/start
    tag @s remove satyrn.fdl.warHogsBlightedHarvest.tilling

    advancement revoke @s only foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/on_till
}

# Runs when the data pack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.warHogsBlightedHarvest.harvestWheat
    scoreboard objectives remove satyrn.fdl.warHogsBlightedHarvest.harvestCarrots
    scoreboard objectives remove satyrn.fdl.warHogsBlightedHarvest.harvestPotatoes
    scoreboard objectives remove satyrn.fdl.warHogsBlightedHarvest.harvestBeetroots
    scoreboard objectives remove satyrn.fdl.warHogsBlightedHarvest.harvestNetherWart

    scoreboard players reset warHogsBlightedHarvest.pvp <%config.internalScoreboard%>
}

dir on_raycast_success {
    # Occurs when raycast/block succeeds
    function block {
        execute as @s[tag=satyrn.fdl.warHogsBlightedHarvest.tilling] rotated ~ 0 run function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/do_till
        execute as @s[tag=satyrn.fdl.warHogsBlightedHarvest.harvesting] rotated ~ 0 run function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/do_harvest
    }
}

# Performs a raycast to detect a farmland block.
dir raycast {
    dir block {
        # Starts a raycast from the sender's eyes.
        function start {
            scoreboard players reset #step <%config.internalScoreboard%>

            execute at @s anchored eyes rotated ~ ~ run function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/raycast/block/step
        }

        function step {
            execute (positioned ^ ^ ^0.1 if block ~ ~ ~ #foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/raycast_success) {
                !IF(config.dev) {
                    tellraw @a [{"text":"Raycast successful after ","color":"gray"},{"score":{"name":"#step","objective":"<%config.internalScoreboard%>"}},{"text":" / 60 steps.","color":"gray"}]
                }
                function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/on_raycast_success/block
            } else {
                !IF(config.dev) {
                    particle minecraft:smoke
                }
                scoreboard players add #step <%config.internalScoreboard%> 1

                execute positioned ^ ^ ^0.1 rotated ~ ~ if score #step <%config.internalScoreboard%> matches ..60 if block ~ ~ ~ #foxcraft_dungeon_loot:raycast_pass run function foxcraft_dungeon_loot:items/war_hogs_blighted_harvest/raycast/block/step
            }
        }
    }
}
