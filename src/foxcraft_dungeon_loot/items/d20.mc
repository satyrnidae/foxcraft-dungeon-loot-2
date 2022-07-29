import ../../macros.mcm

function give {
    macro give common/d20
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 69 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.dice.d20 player @s ~ ~ ~ 10

        macro random 1 20

        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#random","objective":"<%config.internalScoreboard%>"}}]
    }
}
