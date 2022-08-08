import ../../macros.mcm

# Executes on ticks where a player has used a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/eye_cream/in_main_hand] run {
        playsound foxcraft_dungeon_loot:item.eye_cream.apply player @a ~ ~ ~ 0.5 1.5

        effect give @s minecraft:blindness 3 0 true

        # Roll a D5. If you roll a 1, blindness is applied for 5 minutes.
        #   Otherwise, applies night vision for 20 seconds.
        macro random 1 5
        execute (if score #random <%config.internalScoreboard%> matches 1) {
            effect give @s minecraft:blindness 300
        } else {
            effect give @s minecraft:night_vision 1200
        }

        # Break item
        execute unless entity @s[gamemode=creative] run item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
    }
}
