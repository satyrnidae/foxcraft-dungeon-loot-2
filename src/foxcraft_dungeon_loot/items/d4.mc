import ../../macros.mcm

function give {
    give @s warped_fungus_on_a_stick{DungeonLootId:64,Unbreakable:1,CustomModelData:4219514,display:{Name:'[{"text":"D4","italic":false}]',Lore:['[{"text":"A simple four-sided die."}]','[{"text":"Rarity: ","italic":true},{"text":"Common","color":"white"}]']}} 1
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 64 if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. run {
        playsound foxcraft_dungeon_loot:item.dice.d4 player @s ~ ~ ~ 10

        macro random 1 4

        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#random","objective":"<%config.internalScoreboard%>"}}]
    }
}
