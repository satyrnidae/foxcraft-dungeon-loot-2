import ../../macros.mcm

# Runs on ticks where a player has used a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/d20/in_main_hand] run {
        playsound foxcraft_dungeon_loot:item.dice.d20 player @a

        macro random 1 20

        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#math.result","objective":"<%config.internalScoreboard%>"}}]
    }
}
