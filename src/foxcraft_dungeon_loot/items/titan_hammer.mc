import ../../macros.mcm

function give {
    loot give @s loot foxcraft_dungeon_loot:items/mythic/titan_hammer
}

function on_tick {
    # Add tag to player to know they have the hammer in their main hand (Since they are throwing it, if they only have 1, the next they wouldn't have it in their hand anymore)
    execute if score @s satyrn.fdl.itemId.mainHand matches 75 run {
        tag @s add satyrn.fdl.holdingTitanHammer
    }

    execute if score @s[tag=satyrn.fdl.holdingTitanHammer] satyrn.fdl.used.snowball matches 1.. run {
        stopsound @s * entity.snowball.throw
        playsound minecraft:entity.blaze.shoot player @a ~ ~ ~ 10
        playsound minecraft:item.trident.throw player @a ~ ~ ~ 10

        # Add tag to thrown hammer so we can track it.
        data merge entity @e[type=snowball, limit=1, sort=nearest] {Tags:[satyrn.fdl.titanHammer]}

        # Summon an armor stand (tracker) to track when the hammer breaks.
        execute at @e[type=snowball, limit=1, sort=nearest] run {
            summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Invulnerable:1, Small:1, Tags:[satyrn.fdl.titanHammerTracker]}
            data modify entity @e[tag=satyrn.fdl.titanHammerTracker, limit=1, sort=nearest] Motion set from entity @e[type=snowball, limit=1, sort=nearest] Motion
        }
    }

    # Remove the tag that says the player has a hammer if they no longer have one in their main hand.
    execute unless score @s satyrn.fdl.itemId.mainHand matches 75 run {
        tag @s remove satyrn.fdl.holdingTitanHammer
    }

    # Teleport tracker to the hammer and do all the tracking that needs to be tracked
    execute if entity @e[tag=satyrn.fdl.titanHammerTracker] as @e[tag=satyrn.fdl.titanHammerTracker] at @s run {
        execute (if entity @e[tag=satyrn.fdl.titanHammer, distance=..2, limit=1, sort=nearest] at @e[tag=satyrn.fdl.titanHammer, limit=1, sort=nearest]) {
            # Set motion instead of tp
            data modify entity @s Motion set from entity @e[tag=satyrn.fdl.titanHammer, distance=..1, limit=1, sort=nearest] Motion
            particle minecraft:small_flame ~ ~ ~ 0.1 0.1 0.1 0 1
            particle minecraft:smoke ~ ~ ~ 0.1 0.1 0.1 0 1
        # If tracker cannot find a hammer, it hit something and was destroyed.
        } else {
            # Search for entity to damage
            execute (anchored feet if entity @e[type=!#foxcraft_dungeon_loot:non_living, dx=0, limit=1, sort=nearest] as @e[type=!#foxcraft_dungeon_loot:non_living, dx=0, limit=1, sort=nearest] at @s) {
                playsound minecraft:entity.blaze.hurt player @a ~ ~ ~ 10
                # Set on fire for 5 seconds (100 ticks)
                data merge entity @s {Fire:100}
                # Deal damage via potion effects for both living and undead targets
                execute (if entity @s[type=#foxcraft_dungeon_loot:undead] at @s) {
                    effect give @s minecraft:instant_health 10
                } else {
                    effect give @s minecraft:instant_damage 10
                }
            } else {
                playsound minecraft:entity.shulker.close player @a ~ ~ ~ 20
            }

            # Spawn new hammer that will disappear after 5 seconds (100 ticks)
            loot spawn ~ ~ ~ loot foxcraft_dungeon_loot:items/mythic/titan_hammer
            data merge entity @e[type=item, limit=1, sort=nearest] {Age: 5900, Tags:[satyrn.fdl.titanHammerSpawnedItem]}

            # Destroy tracker, play hit sound, and hit particle effects
            particle minecraft:flame ~ ~ ~ 0.5 0.2 0.5 0 20
            particle minecraft:smoke ~ ~ ~ 0.5 0.1 0.5 0 10
            kill @s
        }
    }

    # Track newly spawned hammers after they were destroyed.
    # If one is about to disappear, play sound, spawn particle effects, and delete the tag so it only happens once.
    execute if entity @e[tag=satyrn.fdl.titanHammerSpawnedItem] as @e[tag=satyrn.fdl.titanHammerSpawnedItem] at @s run {
        execute if entity @s[nbt={Age: 5999s}] run {
            particle minecraft:explosion ~ ~ ~ 0.2 0.2 0.2 0 10
            particle minecraft:flame ~ ~ ~ 0.3 0.2 0.3 0 60
            particle minecraft:smoke ~ ~ ~ 0.3 0.2 0.3 0 30
            playsound minecraft:entity.shulker_bullet.hit player @a ~ ~ ~ 20
            tag @s remove satyrn.fdl.titanHammerSpawnedItem
        }
    }
}
