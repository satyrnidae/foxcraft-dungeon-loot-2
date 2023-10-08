import ../../macros.mcm

# Occurs on ticks when a player is using a warped fungus on a stick.
function on_warped_fungus_used {
    # Execute the following if the sender has Deilona's Holy Blessings equipped in their main hand
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/ima_leaf/in_main_hand] run {
        particle minecraft:smoke ~ ~ ~ 0.5 1 0.5 0 100
        playsound foxcraft_dungeon_loot:item.ima_leaf.pop player @a
        execute if block ~ ~-1 ~ #minecraft:dirt run function foxcraft_dungeon_loot:items/ima_leaf/plant_sapling
        tp @s ~ ~10000 ~

        # Break the item
        execute unless entity @s[gamemode=creative] run {
            playsound minecraft:entity.item.break player @s ~ ~10000 ~
            macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219520}
        }
    }
}

function plant_sapling {
    execute if block ~ ~ ~ #foxcraft_dungeon_loot:items/ima_leaf/replaceable_blocks run {
        macro random 0 7
        execute (if score #math.result <%config.internalScoreboard%> matches 0) {
            execute unless block ~ ~ ~ minecraft:oak_sapling run setblock ~ ~ ~ minecraft:oak_sapling destroy
        } else execute (if score #math.result <%config.internalScoreboard%> matches 1) {
            execute unless block ~ ~ ~ minecraft:birch_sapling run setblock ~ ~ ~ minecraft:birch_sapling destroy
        } else execute (if score #math.result <%config.internalScoreboard%> matches 2) {
            execute unless block ~ ~ ~ minecraft:spruce_sapling run setblock ~ ~ ~ minecraft:spruce_sapling destroy
        } else execute (if score #math.result <%config.internalScoreboard%> matches 3) {
            execute unless block ~ ~ ~ minecraft:jungle_sapling run setblock ~ ~ ~ minecraft:jungle_sapling destroy
        } else execute (if score #math.result <%config.internalScoreboard%> matches 4) {
            execute unless block ~ ~ ~ minecraft:acacia_sapling run setblock ~ ~ ~ minecraft:acacia_sapling destroy
        } else execute (if score #math.result <%config.internalScoreboard%> matches 5) {
            execute unless block ~ ~ ~ minecraft:dark_oak_sapling run setblock ~ ~ ~ minecraft:dark_oak_sapling destroy
        } else execute (if score #math.result <%config.internalScoreboard%> matches 6) {
            execute unless block ~ ~ ~ minecraft:mangrove_propagule run setblock ~ ~ ~ minecraft:mangrove_propagule destroy
        } else {
            macro random 0 1
            execute unless block ~ ~ ~ #foxcraft_dungeon_loot:items/ima_leaf/azaleas run {
                execute (if score #math.result <%config.internalScoreboard%> matches 0) {
                    setblock ~ ~ ~ minecraft:azalea destroy
                } else {
                    setblock ~ ~ ~ minecraft:flowering_azalea destroy
                }
            }
        }
    }
}
