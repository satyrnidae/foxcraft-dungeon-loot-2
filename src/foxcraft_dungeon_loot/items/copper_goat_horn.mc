# TAGS
# satyrn.fdl.copperGoatHorn.isPlaying - Marks entities for whom a goat horn is currently playing.

# Called when the player is using a goat horn.
function on_using_item {
    stopsound @a record minecraft:item.goat_horn.sound.4

    execute unless entity @s[tag=satyrn.fdl.copperGoatHorn.isPlaying] run {

        execute store result score @s satyrn.fdl.copperGoatHorn.currentPitch run data get entity @s Rotation[1]

        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={great_sky_falling=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.great_sky_falling record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.great_sky_falling record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.great_sky_falling record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={old_hymn_resting=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.old_hymn_resting record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.old_hymn_resting record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.old_hymn_resting record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={pure_water_desire=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.pure_water_desire record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.pure_water_desire record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.pure_water_desire record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={mumble_fire_memory=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.mumble_fire_memory record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.mumble_fire_memory record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.mumble_fire_memory record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={dry_urge_anger=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.dry_urge_anger record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.dry_urge_anger record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.dry_urge_anger record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={clear_temper_journey=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.clear_temper_journey record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.clear_temper_journey record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.clear_temper_journey record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={fresh_nest_thought=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.fresh_nest_thought record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.fresh_nest_thought record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.fresh_nest_thought record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={secret_lake_tear=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.secret_lake_tear record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.secret_lake_tear record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.secret_lake_tear record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={fearless_river_gift=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.fearless_river_gift record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.fearless_river_gift record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.fearless_river_gift record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
        execute if entity @s[advancements={foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item={sweet_moon_love=true}}] run {
            execute (if entity @s[predicate=foxcraft_dungeon_loot:is_sneaking]) {
                playsound minecraft:item.copper_goat_horn.bass.sweet_moon_love record @a ~ ~ ~ 16.0
            } else execute (if score @s satyrn.fdl.copperGoatHorn.currentPitch <= copperGoatHorn.pitchAngle <%config.internalScoreboard%>) {
                playsound minecraft:item.copper_goat_horn.harmony.sweet_moon_love record @a ~ ~ ~ 16.0
            } else {
                playsound minecraft:item.copper_goat_horn.melody.sweet_moon_love record @a ~ ~ ~ 16.0
            }
            tag @s add satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.soundCooldown = copperGoatHorn.cooldown <%config.internalScoreboard%>
        }
    }

    advancement revoke @s only foxcraft_dungeon_loot:items/copper_goat_horn/on_using_item
}

function on_load {
    scoreboard objectives add satyrn.fdl.copperGoatHorn.soundCooldown dummy
    scoreboard objectives add satyrn.fdl.copperGoatHorn.particle dummy
    scoreboard objectives add satyrn.fdl.copperGoatHorn.currentPitch dummy

    scoreboard players set copperGoatHorn.pitchAngle <%config.internalScoreboard%> -30
    scoreboard players set copperGoatHorn.cooldown <%config.internalScoreboard%> 79
    scoreboard players set #10 <%config.internalScoreboard%> 10
}

function on_tick {
    execute as @a[scores={satyrn.fdl.copperGoatHorn.soundCooldown=0..}] run {
        execute (unless score @s satyrn.fdl.copperGoatHorn.soundCooldown matches 1..) {
            tag @s remove satyrn.fdl.copperGoatHorn.isPlaying
            scoreboard players reset @s satyrn.fdl.copperGoatHorn.soundCooldown
            scoreboard players reset @s satyrn.fdl.copperGoatHorn.particle
        } else {
            scoreboard players remove @s satyrn.fdl.copperGoatHorn.soundCooldown 1

            scoreboard players operation @s satyrn.fdl.copperGoatHorn.particle = @s satyrn.fdl.copperGoatHorn.soundCooldown
            scoreboard players operation @s satyrn.fdl.copperGoatHorn.particle %= #10 <%config.internalScoreboard%>

            execute if score @s satyrn.fdl.copperGoatHorn.particle matches 0 at @s anchored eyes run particle minecraft:note ^ ^0.5 ^
        }
    }
}

function on_uninstall {
    scoreboard objectives remove satyrn.fdl.copperGoatHorn.soundCooldown
    scoreboard objectives remove satyrn.fdl.copperGoatHorn.currentPitch
    scoreboard objectives remove satyrn.fdl.copperGoatHorn.particle
}
