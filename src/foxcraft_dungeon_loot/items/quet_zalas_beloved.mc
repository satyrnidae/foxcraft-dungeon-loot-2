# Runs when a player falls.
function on_fall {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/quet_zalas_beloved/should_parachute] run {
        playsound foxcraft_dungeon_loot:item.quet_zalas_beloved.wings_flap player @a ~ ~ ~ 1.0 1.5
        effect give @s minecraft:slow_falling 3

        execute unless entity @s[gamemode=creative] run {
            execute (if entity @e[predicate=foxcraft_dungeon_loot:items/chest_has_unbreaking]) {
                execute store result score #math.input1 <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:102b}].tag.Enchantments[{id:"minecraft:unbreaking"}].lvl
                function foxcraft_dungeon_loot:math/should_damage_armor
                execute if score #math.result <%config.internalScoreboard%> matches 1 run item modify entity @s armor.chest foxcraft_dungeon_loot:quet_zalas_beloved/damage_slow_falling
            } else {
                item modify entity @s armor.chest foxcraft_dungeon_loot:quet_zalas_beloved/damage_slow_falling
            }
        }
    }
}
