function on_load {
    # Create math input scoreboards
    scoreboard objectives add satyrn.fdl.math.input1 dummy
    scoreboard objectives add satyrn.fdl.math.input2 dummy
}

function random {
    # Convert lower and upper bounds to lower bounds and a range
    scoreboard players operation @s satyrn.fdl.math.input2 -= @s satyrn.fdl.math.input1
    scoreboard players add @s satyrn.fdl.math.input2 1

    # Summon temporary area effect clouds to store math values
    LOOP(2,i) {
        summon minecraft:area_effect_cloud ~ ~ ~ {Tags:[satyrn.fdl.random],Duration:10}
    }

    # Generate a random 32-bit integer number.
    LOOP(31,i) {
        scoreboard players add @e[type=minecraft:area_effect_cloud,tag=satyrn.fdl.random,distance=..1,sort=random,limit=1] satyrn.fdl.math.input1 <%Math.pow(2,i)%>
    }

    # Set output and limit to the specified range.
    scoreboard players operation #random <%config.internalScoreboard%> = @e[type=minecraft:area_effect_cloud,tag=satyrn.fdl.random,distance=..1,limit=1] satyrn.fdl.math.input1
    # Modulo over range and add lower bound as offset
    scoreboard players operation #random <%config.internalScoreboard%> %= @s satyrn.fdl.math.input2
    scoreboard players operation #random <%config.internalScoreboard%> += @s satyrn.fdl.math.input1

    # Reset inputs to their original values.
    scoreboard players operation @s satyrn.fdl.math.input2 += @s satyrn.fdl.math.input1
    scoreboard players remove @s satyrn.fdl.math.input2 1

    !IF(config.dev) {
        tellraw @s ["", {"text":"Result: ","color":"gray","italic":true},{"score":{"name":"#random","objective":"<%config.internalScoreboard%>"},"color":"gray","italic":true},{"text":" / ","color":"gray","italic":true},{"score":{"name":"@s","objective":"satyrn.fdl.math.input2"},"color":"gray","italic":true}]
    }

    # Reset RNG scoreboard
    scoreboard players reset @e[type=minecraft:area_effect_cloud,tag=satyrn.fdl.random,distance=..1] satyrn.fdl.math.input1
}
