import ../../macros.mcm

# Relevant Entity Tags:
# satyrn.fdl.torenhiasFist.heldItem - A player that was holding Tor'Enhia's Fist
# satyrn.fdl.torenhiasFist.projectile - The snowball projectile
# satyrn.fdl.torenhiasFist.projectileTracker - The armor stand tracking the projectile
# satyrn.fdl.torenhiasFist.lightningSpawner - The marker entity in charge of spawning lighting

# Occurs once per player per tick.
function on_tick {
    # Execute if a player who was holding Tor'Enhia's Fist threw the item from their main hand.
    execute if score @s[tag=satyrn.fdl.torenhiasFist.heldItem] satyrn.fdl.used.snowball matches 1.. run {
        execute as @e[type=minecraft:snowball,limit=1,sort=nearest] at @s run {
            # Tag the snowball as the projectile.
            tag @s add satyrn.fdl.torenhiasFist.projectile

            summon minecraft:armor_stand ^ ^ ^ {Invisible:<%config.dev?0:1%>b,Invulnerable:1b,Small:1b,Silent:1b,Tags:[satyrn.fdl.torenhiasFist.projectileTracker]}
            data modify entity @e[tag=satyrn.fdl.torenhiasFist.projectileTracker,limit=1,sort=nearest] Motion set from entity @s Motion
        }
    }

    # Execute if a player who was holding Tor'Enhia's Fist threw the item from their off hand.
    # Need to make sure they aren't tagged for a main-hand snowball item from ANY OTHER DUNGEON LOOT ITEM
    # which is executed AFTER this one in the on-tick tag.



    # Add a tag to players holding Tor'Enhia's Fist, and remove the tag from players who aren't.
    execute (if score @s satyrn.fdl.itemId.mainHand matches 80) {
        tag @s add satyrn.fdl.torenhiasFist.heldItem
    } else execute (if score @s[predicate=!foxcraft_dungeon_loot:items/is_mainhand_snowball] satyrn.fdl.itemId.offHand matches 80) {
        tag @s add satyrn.fdl.torenhiasFist.heldItem
    } else {
        tag @s remove satyrn.fdl.torenhiasFist.heldItem
    }

    # Update the projectile tracker
    execute as @e[tag=satyrn.fdl.torenhiasFist.projectileTracker,type=#foxcraft_dungeon_loot:markers] at @s run {
        execute (if entity @e[tag=satyrn.fdl.torenhiasFist.projectile,distance=..1,limit=1,sort=nearest]) {
            data modify entity @s Motion set from entity @e[tag=satyrn.fdl.torenhiasFist.projectile,limit=1,sort=nearest] Motion
            particle minecraft:electric_spark ~ ~0.5 ~ 0.25 0 0.25 0.05 1
        } else {
            summon minecraft:marker ~ ~ ~ {Tags:[satyrn.fdl.torenhiasFist.lightningSpawner]}
            loot spawn ^ ^ ^ loot foxcraft_dungeon_loot:items/epic/torenhias_fist
            kill @s
        }
    }

    # Update the lightning spawners
    execute as @e[tag=satyrn.fdl.torenhiasFist.lightningSpawner,type=#foxcraft_dungeon_loot:markers] at @s run {
        execute (unless score @s satyrn.fdl.torenhiasFist.cooldown matches 0..) {
            # 3 seconds until lightning spawns
            scoreboard players set @s satyrn.fdl.torenhiasFist.cooldown 70
            weather thunder 7
        } else execute (unless score @s satyrn.fdl.torenhiasFist.cooldown matches 0) {
            scoreboard players remove @s satyrn.fdl.torenhiasFist.cooldown 1
            scoreboard players operation @s satyrn.fdl.torenhiasFist.particle = @s satyrn.fdl.torenhiasFist.cooldown
            scoreboard players operation @s satyrn.fdl.torenhiasFist.particle %= 5 satyrn.fdl.const

            execute if score @s satyrn.fdl.torenhiasFist.particle matches 0 run {
                particle minecraft:electric_spark ~ ~0.5 ~ 0.25 0 0.25 0.05 3
            }
            execute if score @s satyrn.fdl.torenhiasFist.cooldown matches 10 run {
                summon minecraft:lightning_bolt ^0.25 ^ ^-0.25
            }
            execute if score @s satyrn.fdl.torenhiasFist.cooldown matches 5 run {
                summon minecraft:lightning_bolt ^-0.25 ^ ^0.25
            }
        } else {
            summon minecraft:lightning_bolt
            playsound foxcraft_dungeon_loot:item.torenhias_fist.thunder player @a ~ ~ ~ 4.0
            # Clean up lightning spawner
            kill @s
        }
    }
}
