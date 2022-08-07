import ../../macros.mcm

# Occurs once per player per tick
function on_tick {
    execute (if score @s satyrn.fdl.itemId.offHand matches 19) {
        execute (if entity @s[predicate=foxcraft_dungeon_loot:is_flying]) {
            # Apply absorption once
            execute unless entity @s[tag=satyrn.fdl.totemOfEkila.healthApplied] run {
                effect give @s minecraft:absorption 1000000 1 true
                effect give @s minecraft:health_boost 1000000 0 true
                tag @s add satyrn.fdl.totemOfEkila.healthApplied
            }
            # Apply flying effects
            execute unless entity @s[predicate=foxcraft_dungeon_loot:items/totem_of_ekila/has_flying_effects] run {
                effect give @s minecraft:resistance 1000000 2 true
                tag @s add satyrn.fdl.totemOfEkila.flyingApplied
            }
            execute if entity @s[tag=satyrn.fdl.totemOfEkila.groundedApplied] run {
                effect clear @s minecraft:jump_boost
                effect clear @s minecraft:slow_falling
                tag @s remove satyrn.fdl.totemOfEkila.groundedApplied
            }
        } else {
            execute if entity @s[tag=satyrn.fdl.totemOfEkila.healthApplied] run {
                effect clear @s minecraft:absorption
                effect clear @s minecraft:health_boost
                tag @s remove satyrn.fdl.totemOfEkila.healthApplied
            }
            execute if entity @s[tag=satyrn.fdl.totemOfEkila.flyingApplied] run {
                effect clear @s minecraft:resistance
                tag @s remove satyrn.fdl.totemOfEkila.flyingApplied
            }
            execute unless entity @s[predicate=foxcraft_dungeon_loot:items/totem_of_ekila/has_grounded_effects] run {
                effect give @s minecraft:jump_boost 1000000 2 true
                effect give @s minecraft:slow_falling 1000000 0 true
                tag @s add satyrn.fdl.totemOfEkila.groundedApplied
            }
        }
    } else {
        execute if entity @s[tag=satyrn.fdl.totemOfEkila.healthApplied] run {
            effect clear @s minecraft:absorption
            effect clear @s minecraft:health_boost
            tag @s remove satyrn.fdl.totemOfEkila.healthApplied
        }
        execute if entity @s[tag=satyrn.fdl.totemOfEkila.groundedApplied] run {
            effect clear @s minecraft:jump_boost
            effect clear @s minecraft:slow_falling
            tag @s remove satyrn.fdl.totemOfEkila.groundedApplied
        }
        execute if entity @s[tag=satyrn.fdl.totemOfEkila.flyingApplied] run {
            effect clear @s minecraft:resistance
            tag @s remove satyrn.fdl.totemOfEkila.flyingApplied
        }
    }
}
