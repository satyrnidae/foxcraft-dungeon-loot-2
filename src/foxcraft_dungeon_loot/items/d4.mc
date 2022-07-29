import ../../macros.mcm

function give {
    macro give_as_loot common/d4
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 64 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.dice.d4 player @s ~ ~ ~ 10

        macro random 1 4

        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#random","objective":"<%config.internalScoreboard%>"}}]
    }
}
