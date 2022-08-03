import ../../macros.mcm

function give {
    macro give_as_loot epic/spell_scroll_hail_of_arrows
}

# TAGS
# Holding Spell Scroll Hail of Arrows:      satyrn.fdl.holdingSC_HOA
# Snowball entity representing the scroll:  satyrn.fdl.SC_HOA
# Armor stand for tracking                  satyrn.fdl.SC_HOA_tracker

function on_tick {
    # Add tag to player to know they have the scroll in their main hand (Since they are throwing it, if they only have 1, the next they wouldn't have it in their hand anymore)
    execute if score @s satyrn.fdl.itemId.mainHand matches 78 run {
        tag @s add satyrn.fdl.holdingSC_HOA
    }

    execute if score @s[tag=satyrn.fdl.holdingSC_HOA] satyrn.fdl.used.snowball matches 1.. run {
        stopsound @s * entity.snowball.throw
        playsound minecraft:entity.evoker.cast_spell player @a ~ ~ ~ 10

        # Add tag to thrown scroll so we can track it.
        data merge entity @e[type=snowball, limit=1, sort=nearest] {Tags:[satyrn.fdl.SC_HOA]}

        # Summon an armor stand (tracker) to track when the scroll breaks.
        execute at @e[type=snowball, limit=1, sort=nearest] run {
            summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Invulnerable:1b,Small:1b,Silent:1b,Tags:[satyrn.fdl.SC_HOA_tracker]}
            data modify entity @e[tag=satyrn.fdl.SC_HOA_tracker, limit=1, sort=nearest] Motion set from entity @e[type=snowball, limit=1, sort=nearest] Motion
        }
    }

    # Remove the tag that says the player has a scroll if they no longer have one in their main hand.
    execute unless score @s satyrn.fdl.itemId.mainHand matches 78 run {
        tag @s remove satyrn.fdl.holdingSC_HOA
    }

    # Teleport tracker to the scroll and do all the tracking that needs to be tracked
    execute if entity @e[tag=satyrn.fdl.SC_HOA_tracker] as @e[tag=satyrn.fdl.SC_HOA_tracker] at @s run {
        execute (if entity @e[tag=satyrn.fdl.SC_HOA, distance=..1, limit=1, sort=nearest] at @e[tag=satyrn.fdl.SC_HOA, limit=1, sort=nearest]) {
            # Set motion instead of tp
            data modify entity @s Motion set from entity @e[tag=satyrn.fdl.SC_HOA, distance=..1, limit=1, sort=nearest] Motion
            particle minecraft:enchant ~ ~ ~ 0.1 0.1 0.1 0 3
        # If tracker cannot find a scroll, it hit something and was destroyed.
        } else {
            # Launch Hail of Arrows
            playsound minecraft:entity.evoker.prepare_attack player @a ~ ~ ~ 10
            particle minecraft:enchant ~ ~ ~ 1 0.5 1 0 100
            function foxcraft_dungeon_loot:items/spell_scroll_hail_of_arrows/spawn_arrows_1
            function foxcraft_dungeon_loot:items/spell_scroll_hail_of_arrows/spawn_arrows_2
            function foxcraft_dungeon_loot:items/spell_scroll_hail_of_arrows/spawn_arrows_3

            #Destroy tracker
            !IF(config.dev) {
                data modify entity @s Motion set value [0f,0f,0f]
                data modify entity @s NoGravity set value 1b
                tag @s remove satyrn.fdl.SC_HOA_tracker
            }
            !IF(!config.dev) {
                kill @s
            }
        }
    }
}

function spawn_arrows_1 {
    LOOP(13,x) {
        LOOP(13,z) {
            !IF(!(Math.abs(x-6)==6 && Math.abs(z-6)==6) && !(Math.abs(x-6)==5 && Math.abs(z-6)==5) && !(Math.abs(x-6)==6 && Math.abs(z-6)==5) && !(Math.abs(x-6)==5 && Math.abs(z-6)==6) && !(Math.abs(x-6)==6 && Math.abs(z-6)==4) && !(Math.abs(x-6)==4 && Math.abs(z-6)==6)) {
                summon arrow ~<%x-6%> ~30 ~<%z-6%>
            }
        }
    }
}

function spawn_arrows_2 {
    LOOP(13,x) {
        LOOP(13,z) {
            !IF(!(Math.abs(x-6)==6 && Math.abs(z-6)==6) && !(Math.abs(x-6)==5 && Math.abs(z-6)==5) && !(Math.abs(x-6)==6 && Math.abs(z-6)==5) && !(Math.abs(x-6)==5 && Math.abs(z-6)==6) && !(Math.abs(x-6)==6 && Math.abs(z-6)==4) && !(Math.abs(x-6)==4 && Math.abs(z-6)==6)) {
                summon arrow ~<%x-6%> ~45 ~<%z-6%>
            }
        }
    }
}

function spawn_arrows_3 {
    LOOP(13,x) {
        LOOP(13,z) {
            !IF(!(Math.abs(x-6)==6 && Math.abs(z-6)==6) && !(Math.abs(x-6)==5 && Math.abs(z-6)==5) && !(Math.abs(x-6)==6 && Math.abs(z-6)==5) && !(Math.abs(x-6)==5 && Math.abs(z-6)==6) && !(Math.abs(x-6)==6 && Math.abs(z-6)==4) && !(Math.abs(x-6)==4 && Math.abs(z-6)==6)) {
                summon arrow ~<%x-6%> ~60 ~<%z-6%>
            }
        }
    }
}
