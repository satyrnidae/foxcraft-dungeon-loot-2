import ../../macros.mcm

# Occurs on ticks when a player is using a warped fungus on a stick.
function on_warped_fungus_used {
    # Execute the following if the sender has Deilona's Holy Blessings equipped in their main hand
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/ima_leaf/in_main_hand] run {
        particle minecraft:smoke ~ ~ ~ 0.5 1 0.5 0 100
        playsound foxcraft_dungeon_loot:item.ima_leaf.pop player @a
        tp @s ~ 10000 ~

        # Break the item
        execute unless entity @s[gamemode=creative] run {
            playsound minecraft:entity.item.break player @s ~ 10000 ~
            macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219520}
        }
    }
}
