import ../../macros.mcm

function give {
    give @s minecraft:warped_fungus_on_a_stick{DungeonLootId:45,Unbreakable:1,CustomModelData:421952,display:{Name:'[{"text":"Hero\'s Amulet","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Shouldst thou be a true Hero, I shall grant"}]','[{"text":"thee a boon unparalleled.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Fragile: ","italic":false,"color":"red"},{"text":"This item is consumed upon use.","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"Hero\'s Chance:","italic":false,"color":"green"},{"text":" ","color":"dark_purple"},{"text":"Rolls a d20 with a DC of 10.","color":"gray"}]','[{"text":"The outcome of the roll determines the","italic":false,"color":"gray"}]','[{"text":"effect:","italic":false,"color":"gray"},{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"- ","italic":false,"color":"gray"},{"text":"Crit Fail:","color":"white"},{"text":" Grants Bad Omen","color":"gray"}]','[{"text":"- ","italic":false,"color":"gray"},{"text":"Fail:","color":"white"},{"text":" Summons a Vex at your location","color":"gray"}]','[{"text":"- ","italic":false,"color":"gray"},{"text":"Success:","color":"white"},{"text":" Drops 1-10 emeralds","color":"gray"}]','[{"text":"- ","italic":false,"color":"gray"},{"text":"Crit Success:","color":"white"},{"text":" Grants Hero of the Village"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:5} 1
}

function on_tick {
    execute if score @s satyrn.fdl.used.warpedFungusOnAStick matches 1.. if score @s satyrn.fdl.itemId.mainHand matches 45 run {
        macro random 1 20

        execute (if score #random <%config.internalScoreboard%> matches 1) {
            # Crit fail. Player gets a bad omen.
            title @s actionbar {"text":"You are no hero.","color":"dark_purple"}
            playsound minecraft:event.raid.horn hostile @s ~ ~ ~ 200.0 1.0
            effect give @s minecraft:bad_omen 24000 0 false
        } else execute (if score #random <%config.internalScoreboard%> matches ..9) {
            # Fail. Player gets a vex summoned at their location.
            title @s actionbar {"text":"You are not a true hero.","color":"dark_purple"}
            playsound minecraft:entity.evoker.prepare_summon player @s ~ ~ ~ 1 1
            particle minecraft:smoke ^ ^1 ^1.5 0 0.5 0.5 0.1 20
            summon minecraft:vex ^ ^1 ^2
        } else execute (if score #random <%config.internalScoreboard%> matches ..19) {
            # Success. Player gets some random loot.
            title @s actionbar {"text":"You are pure of heart, but you are not a true hero.","color":"dark_purple"}
            playsound minecraft:entity.player.levelup player @s ~ ~ ~ 300 1
            particle minecraft:smoke ^ ^1 ^1.5 0 0.5 0.5 0.1 20
            loot spawn ^ ^1 ^1 loot foxcraft_dungeon_loot:heros_amulet/loot
        } else {
            # Success. Player gets Hero of the Village.
            title @s actionbar {"text":"You are a true hero.","color":"dark_purple"}
            playsound minecraft:ui.toast.challenge_complete player @s ~ ~ ~ 1 1
            effect give @s minecraft:hero_of_the_village 24000 0 false
        }

        execute unless entity @s[nbt={playerGameType:1}] run {
            macro break_item weapon.mainhand minecraft:warped_fungus_on_a_stick{CustomModelData:421952}
        }
    }
}
