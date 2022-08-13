import ../../macros.mcm

# Occurs when a player falls.
function on_fall {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/war_hogs_disdainful_pride/worn] run {
        effect give @s minecraft:slow_falling 3 1

        execute unless entity @s[gamemode=creative] run {
            execute (if entity @s[predicate=foxcraft_dungeon_items:items/feet_have_unbreaking]) {
                execute store result score #math.input1 <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:100b}].tag.Enchantments[{id:"minecraft:unbreaking"}].lvl
                function foxcraft_dungeon_loot:math/should_damage_armor
                execute if score #math.result <%config.internalScoreboard%> matches 1 run item modify entity @s armor.feet foxcraft_dungeon_loot:war_hogs_disdainful_pride/damage_slow_falling
            } else {
                item modify entity @s armor.feet foxcraft_dungeon_loot:war_hogs_disdainful_pride/damage_slow_falling
            }

            execute if entity @s[predicate=foxcraft_dungeon_loot:items/boots_broken] run {
                macro break_item armor.feet minecraft:netherite_boots{CustomModelData:421951}
            }
        }
    }
}
