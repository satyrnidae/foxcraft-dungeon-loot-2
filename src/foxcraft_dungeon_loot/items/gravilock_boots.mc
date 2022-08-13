import ../../macros.mcm

# TAGS USED
# satyrn.fdl.gravilockBoots.effectsApplied - Refers to players who have had the slowness effect from wearing gravilock boots applied.

# Clock that executes every 10 ticks.
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_10t 10t
    execute as @a[predicate=foxcraft_dungeon_loot:items/gravilock_boots/worn] run {
        execute at @s[predicate=foxcraft_dungeon_loot:items/gravilock_boots/has_levitation] run {
            # NBT scan is only performed when levitation effect is removed.
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_on_ground]) {
                playsound foxcraft_dungeon_loot:item.gravilock_boots.spark player @a
            } else {
                playsound foxcraft_dungeon_loot:item.gravilock_boots.zap player @a ~ ~ ~ 1.0 0.5
            }
            # Spawn a particle effect at the player's feet
            particle minecraft:electric_spark ~ ~ ~ 0.1 0 0.1 0.25 5

            # NBT Scan is probably better here than in the main tick.
            execute unless entity @s[gamemode=creative] run {
                execute (if entity @s[predicate=foxcraft_dungeon_loot:items/feet_have_unbreaking]) {
                    # NBT scan to determine unbreaking level.
                    execute store result score #math.input1 <%config.internalScoreboard%> run data get entity @s Inventory[{Slot:100b}].tag.Enchantments[{id:"minecraft:unbreaking"}].lvl
                    function foxcraft_dungeon_loot:math/should_damage_armor
                    execute if score #math.result <%config.internalScoreboard%> matches 1 run function foxcraft_dungeon_loot:items/gravilock_boots/damage
                } else {
                    function foxcraft_dungeon_loot:items/gravilock_boots/damage
                }
            }
        }

        execute if entity @s[predicate=!foxcraft_dungeon_loot:items/gravilock_boots/has_effects] run {
            effect give @s minecraft:slowness 1000000 1
            tag @s add satyrn.fdl.gravilockBoots.effectsApplied
        }
    }

    execute as @a[predicate=!foxcraft_dungeon_loot:items/gravilock_boots/worn,tag=satyrn.fdl.gravilockBoots.effectsApplied] run {
        effect clear @s minecraft:slowness
        tag @s remove satyrn.fdl.gravilockBoots.effectsApplied
    }
}

function damage {
    execute (if entity @s[predicate=foxcraft_dungeon_loot:items/gravilock_boots/is_iron]) {
        item modify entity @s armor.feet foxcraft_dungeon_loot:gravilock_boots/damage_iron
        execute if entity @s[predicate=foxcraft_dungeon_loot:items/boots_broken] run {
            macro break_item armor.feet minecraft:iron_boots{CustomModelData:421953}
        }
    } else execute (if entity @s[predicate=foxcraft_dungeon_loot:items/gravilock_boots/is_diamond]) {
        item modify entity @s armor.feet foxcraft_dungeon_loot:gravilock_boots/damage_diamond
        execute if entity @s[predicate=foxcraft_dungeon_loot:items/boots_broken] run {
            macro break_item armor.feet minecraft:diamond_boots{CustomModelData:421953}
        }
    } else {
        # We'll just assume this is netherite to save on NBT scans.
        item modify entity @s armor.feet foxcraft_dungeon_loot:gravilock_boots/damage_netherite
        execute if entity @s[predicate=foxcraft_dungeon_loot:items/boots_broken] run {
            macro break_item armor.feet minecraft:netherite_boots{CustomModelData:421953}
        }
    }
}

# Schedules the item's clock functions.
function on_load {
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_10t 5t
}
