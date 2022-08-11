import ../../macros.mcm

# Reward function for the advancement
function on_hit {
    execute if entity @s[gamemode=!creative,predicate=!foxcraft_dungeon_loot:items/is_mainhand_empty] run {
        macro random 1 20
        execute if score #random <%config.internalScoreboard%> matches 20 run {
            playsound minecraft:entity.player.attack.crit player @a
            particle minecraft:crit ~ ~ ~ 0.5 0.85 0.5 0.01 20 force

            summon minecraft:item ~ ~ ~ {Tags:[satyrn.fdl.droppedItem],Item:{id:"minecraft:stick",Count:1b},PickupDelay:30}
            data modify entity @e[tag=satyrn.fdl.droppedItem,limit=1] Item set from entity @s SelectedItem

            playsound minecraft:entity.item.pickup player @a ~ ~1.5 ~ 1.0 0.75

            item modify entity @s weapon.mainhand foxcraft_dungeon_loot:remove
        }
    }

    advancement revoke @s only foxcraft_dungeon_loot:items/war_hogs_burning_rage/on_hit
}
