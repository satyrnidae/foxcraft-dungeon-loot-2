###

NOTES ON USE

#math.input1 and #math.input2 from the internal scoreboards are used to store math inputs.
These are not guaranteed to remain unchanged through the course of a math operation; if the numbers must remain for further operations, consider storing them in a separate scoreboard and copying them to #math.input1/2 with a scoreboard players operation command.

#math.result is used to output the result of an equation.

The scoreboard satyrn.fdl.math.temp is used during the processing of functions and should be ignored.

The score of #math.result in the internal scoreboard is undefined unless checked after invoking a function in the same subtick.

###

function on_load {
    # Create math input scoreboards
    scoreboard objectives add satyrn.fdl.math.temp dummy

    scoreboard players set #1200 <%config.internalScoreboard%> 1200
    scoreboard players set #20 <%config.internalScoreboard%> 20
}

function on_uninstall {
    scoreboard objectives remove satyrn.fdl.math.temp
}

###
Sets #math.result in the internal scoreboard to a random 31-bit number within the range between #math.input1 and #math.input2.
Math inputs are preserved at the end of the function, but will be in an undefined state during processing.
The resultant number is unsigned and positive; thus, inputs must be positive as well.
#math.input1 is the lower bound of the range (inclusive).
#math.input2 is the upper bound of the range (inclusive).
Requires a loaded chunk at the execution position and may create a negligible amount of lag as markers are spawned. If markers are not ticked by the server this function should still work.
Execution is synchronous and completes within the same tick that it was started. Any spawned markers are removed at the end of execution.
###
function random {
    # Convert lower and upper bounds to lower bounds and a range
    scoreboard players operation #math.input2 <%config.internalScoreboard%> -= #math.input1 <%config.internalScoreboard%>
    scoreboard players add #math.input2 <%config.internalScoreboard%> 1

    # Summon temporary area effect clouds to store math values
    LOOP(2,i) {
        summon minecraft:marker ~ ~ ~ {Tags:[satyrn.fdl.random]}
    }

    # Generate a random 32-bit integer number.
    LOOP(31,i) {
        scoreboard players add @e[type=minecraft:marker,tag=satyrn.fdl.random,distance=..1,sort=random,limit=1] satyrn.fdl.math.temp <%Math.pow(2,i)%>
    }

    # Set output and limit to the specified range.
    scoreboard players operation #math.result <%config.internalScoreboard%> = @e[type=minecraft:marker,tag=satyrn.fdl.random,sort=random,distance=..1,limit=1] satyrn.fdl.math.temp
    # Modulo over range and add lower bound as offset
    scoreboard players operation #math.result <%config.internalScoreboard%> %= #math.input2 <%config.internalScoreboard%>
    scoreboard players operation #math.result <%config.internalScoreboard%> += #math.input1 <%config.internalScoreboard%>

    # Reset inputs to their original values.
    scoreboard players operation #math.input2 <%config.internalScoreboard%> += #math.input1 <%config.internalScoreboard%>
    scoreboard players remove #math.input2 <%config.internalScoreboard%> 1

    !IF(config.dev) {
        tellraw @a ["", {"text":"Result: ","color":"gray","italic":true},{"score":{"name":"#math.input1","objective":"<%config.internalScoreboard%>"},"color":"gray","italic":true},{"text":" / ","color":"gray","italic":true},{"score":{"name":"#math.result","objective":"<%config.internalScoreboard%>"},"color":"gray","italic":true},{"text":" / ","color":"gray","italic":true},{"score":{"name":"#math.input2","objective":"<%config.internalScoreboard%>"},"color":"gray","italic":true}]
    }

    # Kill the markers
    kill @e[type=minecraft:marker,tag=satyrn.fdl.random,distance=..1]
}

###
Sets #math.result in the internal scoreboard to a boolean int based on the values of #math.input1 in the internal scoreboard.
If the function returns a 0, the tool should not be damaged.
If the function returns a 1, the tool should be damaged.
###
function should_damage_tool {
    execute (unless score #math.input1 <%config.internalScoreboard%> matches 1..) {
        scoreboard players set #math.result 1
    } else {
        scoreboard players set #math.input2 <%config.internalScoreboard%> 32767
        scoreboard players add #math.input1 <%config.internalScoreboard%> 1
        scoreboard players operation #math.input2 <%config.internalScoreboard%> /= #math.input1 <%config.internalScoreboard%>
        scoreboard players operation @s satyrn.fdl.math.temp = #math.input2 <%config.internalScoreboard%>

        scoreboard players set #math.input1 <%config.internalScoreboard%> 1
        scoreboard players set #math.input2 <%config.internalScoreboard%> 32767
        function foxcraft_dungeon_loot:math/random

        execute (if score #math.result <%config.internalScoreboard%> < @s satyrn.fdl.math.temp) {
            scoreboard players set #math.result <%config.internalScoreboard%> 1
        } else {
            scoreboard players set #math.result <%config.internalScoreboard%> 0
        }
    }
}


# This function operates identically to the should_damage_tool function above, but uses a slightly different function tuned to armor and other wearable items.
# If the function returns a 0, the tool should not be damaged.
# If the function returns a 1, the tool should be damaged.
function should_damage_armor {
    execute (unless score #math.input1 <%config.internalScoreboard%> matches 1..) {
        scoreboard players set #math.result 1
    } else {
        # Approximates a limit of chance not to break approaching 40%
        scoreboard players set #math.input2 <%config.internalScoreboard%> 13107
        scoreboard players add #math.input1 <%config.internalScoreboard%> 1
        scoreboard players operation #math.input2 <%config.internalScoreboard%> /= #math.input1 <%config.internalScoreboard%>
        scoreboard players add #math.input2 <%config.internalScoreboard%> 19660
        scoreboard players operation @s satyrn.fdl.math.temp = #math.input2 <%config.internalScoreboard%>

        scoreboard players set #math.input1 <%config.internalScoreboard%> 1
        scoreboard players set #math.input2 <%config.internalScoreboard%> 32767
        function foxcraft_dungeon_loot:math/random

        execute (if score #math.result <%config.internalScoreboard%> < @s satyrn.fdl.math.temp) {
            scoreboard players set #math.result <%config.internalScoreboard%> 1
        } else {
            scoreboard players set #math.result <%config.internalScoreboard%> 0
        }
    }
}

###
This function converts the input value into both minutes and seconds.
Use #math.input1 for input, #math.minutes and #math.seconds for results.
###
function ticks_to_min_sec {
    scoreboard players operation #math.minutes <%config.internalScoreboard%> = #math.input1 <%config.internalScoreboard%>
    scoreboard players operation #math.seconds <%config.internalScoreboard%> = #math.input1 <%config.internalScoreboard%>

    # Convert input to rough minutes.
    scoreboard players operation #math.minutes <%config.internalScoreboard%> /= #1200 <%config.internalScoreboard%>

    # Convert remainder to rough seconds.
    scoreboard players operation #math.seconds <%config.internalScoreboard%> %= #1200 <%config.internalScoreboard%>
    scoreboard players operation #math.seconds <%config.internalScoreboard%> /= #20 <%config.internalScoreboard%>
}
