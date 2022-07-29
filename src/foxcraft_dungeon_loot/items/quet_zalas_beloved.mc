import ../../macros.mcm

function give {
    macro give_as_loot mythic/quet_zalas_beloved
}

function on_tick {
    execute if score @s satyrn.fdl.custom.fallOneCm matches 400.. if score @s satyrn.fdl.itemId.chestplate matches 50 if score @s satyrn.fdl.custom.fallFlying matches 0 run {
        execute unless entity @s[nbt={Inventory:[{Slot:102b,tag:{Damage:431}}]}] run {
            effect give @s minecraft:slow_falling 3

            execute unless entity @s[gamemode=creative] run {
                item modify entity @s armor.chest foxcraft_dungeon_loot:quet_zalas_beloved/damage_slow_falling
            }
        }
    }
}
