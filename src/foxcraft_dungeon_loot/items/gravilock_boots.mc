import ../../macros.mcm

# Clock that executes every 10 ticks.
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_10t 10t
    execute as @a at @s if score @s satyrn.fdl.itemId.boots matches 33 run {
        # This is probably faster than an NBT scan, right?
        execute store success score #test <%config.internalScoreboard%> run effect clear @s minecraft:levitation
        # Check if we successfully cleared the levitation effect
        execute if score #test <%config.internalScoreboard%> matches 1 run {
            # NBT scan is only performed when levitation effect is removed.
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_on_ground]) {
                playsound foxcraft_dungeon_loot:item.gravilock_boots.spark player @s ~ ~ ~ 1.0 1.0
            } else {
                playsound foxcraft_dungeon_loot:item.gravilock_boots.zap player @s ~ ~ ~ 1.0 0.5
            }
            # Spawn a particle effect at the player's feet
            particle minecraft:effect ~ ~ ~ 0.1 0 0.1 0.25 5

            # NBT Scan is probably better here than in the main tick.
            execute unless entity @s[gamemode=creative] run {
                # NBT scan needed to determine the amount of damage to apply to the boots.
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
        }
    }
}

# Clock that executes every 2 seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.boots matches 33 run effect give @s minecraft:slowness 3 1 true
}

# Gives the sender a copy of the item.
function give {
    macro give_as_loot mythic/gravilock_boots
}

dir give {
    # Gives the sender a copy of the item. The item is upgraded to diamond.
    function diamond {
        macro give_as_variant_loot mythic/gravilock_boots 1
    }

    # Gives the sender a copy of the item. The item is upgraded to netherite.
    function netherite {
        macro give_as_variant_loot mythic/gravilock_boots 2
    }
}

# Schedules the item's clock functions.
function on_load {
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_10t 4t
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_2s 5t
}
