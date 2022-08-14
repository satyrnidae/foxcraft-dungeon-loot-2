import ../../macros.mcm

# Runs every 3 seconds.
function clock_3s {
    schedule function foxcraft_dungeon_loot:items/buckwheat/clock_3s 3s

    execute as @a[predicate=foxcraft_dungeon_loot:items/buckwheat/in_main_hand] at @s run {
        scoreboard players set #test <%config.internalScoreboard%> 0
        # Up to 10 livestock mobs within 5 blocks with an age of 0 (breeding cooldown is over)
        execute as @e[type=#foxcraft_dungeon_loot:livestock, distance=..5, predicate=foxcraft_dungeon_loot:items/buckwheat/can_breed, limit=10, sort=nearest] at @s run {
            # Set in love for 10 seconds.
            data modify entity @s InLove set from storage foxcraft_dungeon_loot:items Buckwheat.InLove
            particle minecraft:heart ~ ~1 ~ 0.2 0.2 0.2 0 10
            scoreboard players add #test <%config.internalScoreboard%> 1
        }

        execute if score #test <%config.internalScoreboard%> matches 1.. unless entity @s[gamemode=creative] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_has_unbreaking]) {
                # Get unbreaking level from the tool.
                execute store result score #math.input1 <%config.internalScoreboard%> run data get entity @s SelectedItem.tag.Enchantments[{id:"minecraft:unbreaking"}].lvl
                function foxcraft_dungeon_loot:math/should_damage_tool
                execute if score #math.result <%config.internalScoreboard%> matches 1 run function foxcraft_dungeon_loot:items/buckwheat/damage_tool
            } else {
                function foxcraft_dungeon_loot:items/buckwheat/damage_tool
            }

            execute if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_broken] run {
                macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:4219526}
            }
        }
    }
}

function damage_tool {
    execute if score #test <%config.internalScoreboard%> matches 1 run item modify entity @s weapon.mainhand foxcraft_dungeon_loot:buckwheat/damage_1
    LOOP(4,i) {
        execute if score #test <%config.internalScoreboard%> matches <%2*(i+1)%>..<%2*(i+1)+1%> run item modify entity @s weapon.mainhand foxcraft_dungeon_loot:buckwheat/damage_<%2*(i+1)%>
    }
    execute if score #test <%config.internalScoreboard%> matches 10.. run item modify entity @s weapon.mainhand foxcraft_dungeon_loot:buckwheat/damage_10
}

# Runs when the datapack is loaded.
function on_load {
    schedule function foxcraft_dungeon_loot:items/buckwheat/clock_3s 1t
    data merge storage foxcraft_dungeon_loot:items {Buckwheat:{InLove:600}}
}

# Runs when the datapack is uninstalled via the uninstall command.
function on_uninstall {
    data remove storage foxcraft_dungeon_loot:items Buckwheat.InLove
}
