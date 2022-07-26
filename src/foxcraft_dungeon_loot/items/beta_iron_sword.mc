import ../../macros.mcm

# Stop the shield sound and play the sword sound if the cooldown is met.
function on_block {
    stopsound @a * minecraft:item.shield.block

    execute unless score @s satyrn.fdl.betaIronSword.soundCooldown matches 1.. run {
        scoreboard players set @s satyrn.fdl.betaIronSword.soundCooldown 10
        playsound foxcraft_dungeon_loot:item.beta_iron_sword.block player @s
    }
}

# Damage the sword when it is used to hit an entity. This takes unbreaking into effect.
function on_hit {
    execute unless entity @s[gamemode=creative] run {
        execute (if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_has_unbreaking]) {
            # Get unbreaking level from the tool.
            execute store result score #math.input1 <%config.internalScoreboard%> run data get entity @s SelectedItem.tag.Enchantments[{id:"minecraft:unbreaking"}].lvl
            function foxcraft_dungeon_loot:math/should_damage_tool
            # Only execute the following if the score is equal to 1 or more
            execute if score #math.result <%config.internalScoreboard%> matches 1 run item modify entity @s weapon.mainhand foxcraft_dungeon_loot:beta_iron_sword/on_hit
        } else {
            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:beta_iron_sword/on_hit
        }

        execute if entity @s[predicate=foxcraft_dungeon_loot:items/mainhand_broken] run {
            macro break_item weapon.mainhand minecraft:shield{CustomModelData:421950}
        }
    }

    advancement revoke @s only foxcraft_dungeon_loot:items/beta_iron_sword/on_hit
}

# Executes when the plugin is loaded.
function on_load {
    scoreboard objectives add satyrn.fdl.betaIronSword.soundCooldown dummy
}

# Executes on each tick.
function on_tick {
    execute as @a[scores={satyrn.fdl.betaIronSword.soundCooldown=1..}] run {
        scoreboard players remove @s satyrn.fdl.betaIronSword.soundCooldown 1
    }
}

function on_uninstall {
    scoreboard objectives remove satyrn.fdl.betaIronSword.soundCooldown
}
