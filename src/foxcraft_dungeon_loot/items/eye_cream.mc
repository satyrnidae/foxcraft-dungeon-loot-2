import ../../macros.mcm

# Gives the sender a copy of the item.
function give {
    macro give_as_loot rare/eye_cream
}

# Handles the item updates each tick. Executed in the context of a single player.
function on_tick {
    execute if score @s[predicate=!foxcraft_dungeon_loot:items/offhand_prevents_use] satyrn.fdl.itemId.mainHand matches 42 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.eye_cream.apply player @a ~ ~ ~ 0.5 1.5

        effect give @s minecraft:blindness 3 0 true

        # Roll a D5. If you roll a 1, blindness is applied for 5 minutes.
        #   Otherwise, applies night vision for 20 seconds.
        macro random 1 5
        execute (if score #random <%config.internalScoreboard%> matches 1) {
            effect give @s minecraft:blindness 300
        } else {
            effect give @s minecraft:night_vision 1200
        }

        # Break item
        execute unless entity @s[gamemode=creative] run {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }
    }
}
