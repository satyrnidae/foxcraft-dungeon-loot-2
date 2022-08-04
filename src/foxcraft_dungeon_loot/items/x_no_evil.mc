import ../../macros.mcm

# Gives the sender a copy of the item, obtained through a loot table
function give {
    macro give_as_loot mythic/x_no_evil
}

# Relevant Entity Tags:
# satyrn.fdl.xNoEvil.heldItem - A player that is holding the X No Evil item
# satyrn.fdl.xNoEvil.projectile - The snowball thrown by a player who used X No Evil
# satyrn.fdl.xNoEvil.projectileTracker - An armor stand which tracks the projectile. Has a snowball passenger which saves the throwing player's UUID.
# satyrn.fdl.xNoEvil.ownerId - The snowball passenger which saves the throwing player's UUID.
# satyrn.fdl.xNoEvil.areaOfEffect - The area of effect cloud created by the projectile.

# Occurs once per player per tick.
function on_tick {

    # Execute if a tagged player threw a snowball.
    execute if score @s[tag=satyrn.fdl.xNoEvil.heldItem] satyrn.fdl.used.snowball matches 1.. run {
        # Execute the following as the nearest snowball, presumably the one thrown by the player.
        execute as @e[type=minecraft:snowball,limit=1,sort=nearest] at @s run {
            # Tag the snowball as the projectile.
            tag @s add satyrn.fdl.xNoEvil.projectile

            # Summon a tracker armor stand and set its motion relative to the projectile.
            summon minecraft:armor_stand ^ ^ ^ {Invisible:<%config.dev?0:1%>b,Invulnerable:1b,Small:1b,Silent:1b,Tags:[satyrn.fdl.xNoEvil.projectileTracker],Passengers:[{id:"minecraft:snowball",Item:{id:"minecraft:snowball",Count:1b,tag:{CustomModelData:42195}},Owner:[I;0,0,0,0],Tags:[satyrn.fdl.xNoEvil.ownerId]}]}
            data modify entity @e[tag=satyrn.fdl.xNoEvil.projectileTracker,limit=1,sort=nearest] Motion set from entity @s Motion
            data modify entity @e[tag=satyrn.fdl.xNoEvil.ownerId,limit=1,sort=nearest] Owner set from entity @s Owner
        }
    }

    # A tag is added to the player while they are holding X No Evil and is cleared from any player not holding X No Evil.
    execute (if score @s satyrn.fdl.itemId.mainHand matches 79) {
        tag @s add satyrn.fdl.xNoEvil.heldItem
    } else execute (if score @s[predicate=!foxcraft_dungeon_loot:items/is_mainhand_snowball] satyrn.fdl.itemId.offHand matches 79) {
        tag @s add satyrn.fdl.xNoEvil.heldItem
    } else {
        tag @s remove satyrn.fdl.xNoEvil.heldItem
    }

    execute as @e[tag=satyrn.fdl.xNoEvil.projectileTracker] at @s run {
        # If the projectile tracker is near a projectile, set its motion from that projectile.
        execute (if entity @e[tag=satyrn.fdl.xNoEvil.projectile,distance=..1,limit=1,sort=nearest]) {
            data modify entity @s Motion set from entity @e[tag=satyrn.fdl.xNoEvil.projectile,limit=1,sort=nearest] Motion
        } else {
            # Bottle break sound and particles
            playsound minecraft:entity.splash_potion.break player @a ~ ~ ~ 1.5
            particle minecraft:item minecraft:snowball{CustomModelData:421952} ^ ^ ^ 0.25 0.05 0.25 0.1 5
            particle minecraft:effect ^ ^ ^ 0.25 0.05 0.25 0.1 10

            # Randomly select an effect and summon an area effect cloud where the projectile landed.
            macro random 1 10

            execute (if score #random <%config.internalScoreboard%> matches 1) {
                # Summon a 10-foot radius AOE for one minute of blindness
                summon minecraft:area_effect_cloud ^ ^0.1 ^ {Duration:60,Effects:[{Amplifier:0b,Duration:1200,Id:15,ShowIcon:1b}],Radius:10,Tags:[satyrn.fdl.xNoEvil.areaOfEffect],Owner:[I;0,0,0,0]}
            } else execute(if score #random <%config.internalScoreboard%> matches ..3) {
                # Summon a 10-radius AOE for 20 seconds of hunger
                summon minecraft:area_effect_cloud ^ ^0.1 ^ {Duration:60,Effects:[{Amplifier:0b,Duration:400,Id:17,ShowIcon:1b}],Radius:10,Tags:[satyrn.fdl.xNoEvil.areaOfEffect],Owner:[I;0,0,0,0]}
            } else execute(if score #random <%config.internalScoreboard%> matches 4) {
                # Summon a 10-radius AOE for 30 seconds of wither
                summon minecraft:area_effect_cloud ^ ^0.1 ^ {Duration:60,Effects:[{Amplifier:0b,Duration:600,Id:20,ShowIcon:1b}],Radius:10,Tags:[satyrn.fdl.xNoEvil.areaOfEffect],Owner:[I;0,0,0,0]}
            } else execute(if score #random <%config.internalScoreboard%> matches ..6) {
                # Summon a 10-radius AOE for 3 minutes of poison
                summon minecraft:area_effect_cloud ^ ^0.1 ^ {Duration:60,Effects:[{Amplifier:0b,Duration:3600,Id:19,ShowIcon:1b}],Radius:10,Tags:[satyrn.fdl.xNoEvil.areaOfEffect],Owner:[I;0,0,0,0]}
            } else execute(if score #random <%config.internalScoreboard%> matches ..8) {
                # Summon a 10-radius AOE for 60 seconds of nausea
                summon minecraft:area_effect_cloud ^ ^0.1 ^ {Duration:60,Effects:[{Amplifier:0b,Duration:1200,Id:9,ShowIcon:1b}],Radius:10,Tags:[satyrn.fdl.xNoEvil.areaOfEffect],Owner:[I;0,0,0,0]}
            } else execute(if score #random <%config.internalScoreboard%> matches ..9) {
                # Summon a 10-radius AOE for instant damage V
                summon minecraft:area_effect_cloud ^ ^0.1 ^ {Duration:60,Effects:[{Amplifier:3b,Id:7,ShowIcon:1b}],Radius:10,Tags:[satyrn.fdl.xNoEvil.areaOfEffect],Owner:[I;0,0,0,0]}
            } else {
                # Summon a 10-radius AOE for 1:30 of slowness
                summon minecraft:area_effect_cloud ^ ^0.1 ^ {Duration:60,Effects:[{Amplifier:2b,Duration:1800,Id:2,ShowIcon:1b}],Radius:10,Tags:[satyrn.fdl.xNoEvil.areaOfEffect],Owner:[I;0,0,0,0]}
            }

            # Set the area of effect's owner to the owner contained in the snowball riding the tracker
            data modify entity @e[tag=satyrn.fdl.xNoEvil.areaOfEffect,predicate=foxcraft_dungeon_loot:items/x_no_evil/is_new_aoe_cloud,limit=1,sort=nearest] Owner set from entity @s Passengers[0].Owner

            # Clean up tracking entity
            kill @e[tag=satyrn.fdl.xNoEvil.ownerId,limit=1,sort=nearest]
            !IF(config.dev) {
                data merge entity @s {Motion:[0.0f,0.0f,0.0f],NoGravity:1b}
                tag @s remove satyrn.fdl.xNoEvil.projectileTracker
            }
            !IF(!config.dev) {
                kill @s
            }
        }
    }
}
