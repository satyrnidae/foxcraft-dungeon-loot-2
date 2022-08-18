import ../../macros.mcm

# Ticks down a player's spam counter
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/dice/clock_2s 2s
    execute as @a[scores={satyrn.fdl.dice.spamCounter=1..}] run {
        scoreboard players remove @s satyrn.fdl.dice.spamCounter 1
    }
}

# Runs when the datapack is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.dice.spamCounter dummy
    scoreboard objectives add satyrn.fdl.dice.spamCooldown dummy

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get dice.spamLockoutThresh <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set dice.spamLockoutThresh <%config.internalScoreboard%> 10

    execute store success score #test <%config.internalScoreboard%> run scoreboard players get dice.spamLockoutTimer <%config.internalScoreboard%>
    execute if score #test <%config.internalScoreboard%> matches 0 run scoreboard players set dice.spamLockoutTimer <%config.internalScoreboard%> 6000

    schedule function foxcraft_dungeon_loot:items/dice/clock_2s 1t
}

# Runs once per tick.
function on_tick {
    execute as @a[scores={satyrn.fdl.dice.spamCooldown=1..}] run {
        scoreboard players remove @s satyrn.fdl.dice.spamCooldown 1
    }

    execute as @a[scores={satyrn.fdl.dice.spamCooldown=0,satyrn.fdl.dice.spamCounter=0}] run {
        scoreboard players reset @s satyrn.fdl.dice.spamCooldown
        tellraw @s {"text":"Spam protection now disabled. Your rolls will be broadcast to the server once more.","color":"red"}
        tag @s remove satyrn.fdl.dice.spamLockout
    }
}

# Runs when the datapack is uninstalled.
function on_uninstall {
    scoreboard objectives remove satyrn.fdl.dice.spamCounter
    scoreboard objectives remove satyrn.fdl.dice.spamCooldown

    scoreboard players reset dice.spamLockoutThresh <%config.internalScoreboard%>
    scoreboard players reset dice.spamLockoutTimer <%config.internalScoreboard%>
}

# Runs when a warped fungus is used.
function on_warped_fungus_used {
    execute (if entity @s[predicate=foxcraft_dungeon_loot:items/d4/in_main_hand]) {
        playsound foxcraft_dungeon_loot:item.dice.d4 player @a
        macro random 1 4
    } else execute (if entity @s[predicate=foxcraft_dungeon_loot:items/d6/in_main_hand]) {
        playsound foxcraft_dungeon_loot:item.dice.d6 player @a
        macro random 1 6
    } else execute (if entity @s[predicate=foxcraft_dungeon_loot:items/d8/in_main_hand]) {
        playsound foxcraft_dungeon_loot:item.dice.d8 player @a
        macro random 1 8
    } else execute (if entity @s[predicate=foxcraft_dungeon_loot:items/d10/in_main_hand]) {
        playsound foxcraft_dungeon_loot:item.dice.d10 player @a
        macro random 1 10
    } else execute (if entity @s[predicate=foxcraft_dungeon_loot:items/d12/in_main_hand]) {
        playsound foxcraft_dungeon_loot:item.dice.d12 player @a
        macro random 1 12
    } else execute (if entity @s[predicate=foxcraft_dungeon_loot:items/d20/in_main_hand]) {
        playsound foxcraft_dungeon_loot:item.dice.d20 player @a
        macro random 1 20
    }

    execute (unless entity @s[tag=satyrn.fdl.dice.spamLockout]) {
        execute (if score @s satyrn.fdl.dice.spamCounter >= dice.spamLockoutThresh <%config.internalScoreboard%>) {
            tellraw @s {"text":"Spam protection is now active; your rolls will not be broadcast to the server for a while.","color":"red"}
            function foxcraft_dungeon_loot:items/dice/notify_result

            scoreboard players operation @s satyrn.fdl.dice.spamCooldown = dice.spamLockoutTimer <%config.internalScoreboard%>
            tag @s add satyrn.fdl.dice.spamLockout
        } else {
            scoreboard players add @s satyrn.fdl.dice.spamCounter 1
            function foxcraft_dungeon_loot:items/dice/broadcast_result
        }
    } else {
        function foxcraft_dungeon_loot:items/dice/notify_result
    }
}

# Tells the server the result of the sender's roll.
function broadcast_result {
    execute (unless score #math.result <%config.internalScoreboard%> matches 8 unless score #math.result <%config.internalScoreboard%> matches 11 unless score #math.result <%config.internalScoreboard%> matches 18) {
        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled a "},{"score":{"name":"#math.result","objective":"<%config.internalScoreboard%>"}}]
    } else {
        tellraw @a ["[", {"selector":"@s"}, {"text": "] Rolled an "},{"score":{"name":"#math.result","objective":"<%config.internalScoreboard%>"}}]
    }
}

# Tells only the sender the result of their roll.
function notify_result {
    execute (unless score #math.result <%config.internalScoreboard%> matches 8 unless score #math.result <%config.internalScoreboard%> matches 11 unless score #math.result <%config.internalScoreboard%> matches 18) {
        tellraw @s [{"text":"[","color":"gray"}, {"selector":"@s","color":"gray"}, {"text": "] Rolled a ","color":"gray"},{"score":{"name":"#math.result","objective":"<%config.internalScoreboard%>"},"color":"gray"}]
    } else {
        tellraw @s [{"text":"[","color":"gray"}, {"selector":"@s","color":"gray"}, {"text": "] Rolled an ","color":"gray"},{"score":{"name":"#math.result","objective":"<%config.internalScoreboard%>"},"color":"gray"}]
    }
}
