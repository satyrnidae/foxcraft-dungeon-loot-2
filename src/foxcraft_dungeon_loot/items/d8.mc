import ../../macros.mcm

function give {
    macro give_as_loot common/d8
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 66 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.dice.d8 player @a

        macro random 1 8

        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#random","objective":"<%config.internalScoreboard%>"}}]
    }
}
