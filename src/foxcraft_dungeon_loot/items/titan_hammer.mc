import ../../macros.mcm

function give {
    give @s snowball{DungeonLootId:75,CustomModelData:4219525,display:{Name:'[{"text":"Hammer of Sol","italic":false,"color":"green"}]', Lore:['[{"text":"Vanquish your foes with a hammer","italic":true,"color":"dark_purple"}]', '[{"text":"of pure celestial fire","italic":true,"color":"dark_purple"}]', '[{"text":"Rarity: ","italic":true,"color":"dark_purple"},{"text":"Mythic","color":"green","italic":true}]']}} 1
}

function on_tick {
    execute if score @s satyrn.fdl.itemId.mainHand matches 75 if score @s satyrn.fdl.used.snowball matches 1.. run {
        stopsound @s * entity.snowball.throw
        playsound minecraft:entity.evoker.prepare_wololo player @s ~ ~ ~ 10

        say "heyo 1"

        # Add tag to thrown snowball so we can track it
        data merge entity @e[type=snowball, limit=1, sort=nearest] {Tags:[satyrn.fdl.titanHammer]}
    }

    # Track thrown snowball
    execute if entity @e[tag=satyrn.fdl.titanHammer] as @e[tag=satyrn.fdl.titanHammer] at @s run {
        execute unless block ~ ~-1 ~ air run {
            say "heyo 3"
            summon tnt
        }
    }
}


# Set item decay Age very high
# set owner?
