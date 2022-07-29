import ../../macros.mcm

function give {
    give @s warped_fungus_on_a_stick{DungeonLootId:67,Unbreakable:1,CustomModelData:4219517,display:{Name:'[{"text":"D10","italic":false}]',Lore:['[{"text":"A simple ten-sided die."}]','[{"text":"Rarity: ","italic":true},{"text":"Common","color":"white"}]']}} 1
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 67 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.dice.d10 player @s ~ ~ ~ 10

        macro random 1 10

        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#random","objective":"<%config.internalScoreboard%>"}}]
    }
}
