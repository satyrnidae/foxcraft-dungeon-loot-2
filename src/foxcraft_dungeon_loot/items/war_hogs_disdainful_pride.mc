import ../../macros.mcm

function give {
    macro give_as_loot mythic/war_hogs_disdainful_pride
}

function on_tick {
    execute if score @s satyrn.fdl.custom.fallOneCm matches 400.. if score @s satyrn.fdl.itemId.boots matches 58 if score @s satyrn.fdl.custom.fallFlying matches 0 run {
        effect give @s minecraft:slow_falling 3 1

        execute unless entity @s[gamemode=creative] run {
            item modify entity @s armor.feet foxcraft_dungeon_loot:war_hogs_disdainful_pride/damage_slow_falling
            execute if entity @s[predicate=foxcraft_dungeon_loot:items/boots_broken] run {
                macro break_item armor.feet minecraft:netherite_boots{CustomModelData:421951}
            }
        }
    }
}
