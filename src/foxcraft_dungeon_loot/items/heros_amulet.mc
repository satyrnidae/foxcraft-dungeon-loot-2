import ../../macros.mcm

# Executed on ticks where a player used a warped fungus on a stick.
function on_warped_fungus_used {
    execute if entity @s[predicate=foxcraft_dungeon_loot:items/heros_amulet/in_main_hand] run {
        macro random 1 20

        execute (if score #math.result <%config.internalScoreboard%> matches 1) {
            # Crit fail. Player gets a bad omen.
            title @s actionbar {"text":"You are no hero.","color":"dark_purple"}
            playsound minecraft:event.raid.horn hostile @a ~ ~ ~ 100
            effect give @s minecraft:bad_omen 24000 0 false
        } else execute (if score #math.result <%config.internalScoreboard%> matches ..9) {
            # Fail. Player gets a vex summoned at their location.
            title @s actionbar {"text":"You are not a true hero.","color":"dark_purple"}
            playsound foxcraft_dungeon_loot:event.roll.fail player @a
            particle minecraft:smoke ^ ^1 ^1.5 0 0.5 0.5 0.1 20
            summon minecraft:vex ^ ^1 ^2
        } else execute (if score #math.result <%config.internalScoreboard%> matches ..19) {
            # Success. Player gets some random loot.
            title @s actionbar {"text":"You are pure of heart, but you are not a true hero.","color":"dark_purple"}
            playsound foxcraft_dungeon_loot:event.roll.pure_heart player @a
            particle minecraft:smoke ^ ^1 ^1.5 0 0.5 0.5 0.1 20
            loot spawn ^ ^1 ^1 loot foxcraft_dungeon_loot:loot/heros_amulet
        } else {
            # Success. Player gets Hero of the Village.
            title @s actionbar {"text":"You are a true hero.","color":"dark_purple"}
            playsound foxcraft_dungeon_loot:event.roll.hero player @a
            effect give @s minecraft:hero_of_the_village 24000 0 false
        }

        execute unless entity @s[gamemode=creative] run {
            macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421952}
        }
    }
}
