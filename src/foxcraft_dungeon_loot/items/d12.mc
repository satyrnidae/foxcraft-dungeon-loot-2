import ../../macros.mcm

function give {
    macro give_as_loot common/d12
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 68 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.dice.d12 player @s ~ ~ ~ 10

        macro random 1 12

        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#random","objective":"<%config.internalScoreboard%>"}}]
    }
}
