import ../macros.mcm

function on_load {
    scoreboard objectives add satyrn.fdl.tradesAdded.grabBag dummy
    scoreboard objectives add satyrn.fdl.tradesToAdd.grabBag dummy
    scoreboard objectives add satyrn.fdl.tradesAdded.head dummy
    scoreboard objectives add satyrn.fdl.tradesToAdd.head dummy
    scoreboard objectives add satyrn.fdl.selectedTrade dummy
    scoreboard objectives add satyrn.fdl.tradesToAdd.mythicItems dummy
    scoreboard objectives add satyrn.fdl.tradesAdded.mythicItems dummy
}

# Tags:
# satyrn.fdl.trades.itemSpawned - For wandering traders. Marks them as already having associated data-storing trade items.
# satyrn.fdl.trades.item - For items. Marks the item as a data-storing trade item
# satyrn.fdl.trades.mainItem - For items. Marks the item as the primary data storage item.
# satyrn.fdl.trades.workItem - For items. Marks the item as the data storage item which will be modified by the existing trades search function.
# satyrn.fdl.trades.hasTrades - For wandering traders. Marks the trader as already having their trades filled.
# satyrn.fdl.trades.hasTrades.head - For wandering traders. Marks the trader as already having their head trades filled.
# satyrn.fdl.trades.hasTrades.grabBag - For wandering traders. Marks the trader as already having their grab bag trades filled.

# Populating loot tables occurs over multiple ticks
function on_tick {
    execute as @e[type=minecraft:wandering_trader,tag=!satyrn.fdl.trades.itemSpawned] at @s run {
        tag @s add satyrn.fdl.trades.itemSpawned
        summon minecraft:item ~ ~ ~ {Tags:[satyrn.fdl.trades.item,satyrn.fdl.trades.mainItem],Item:{id:"minecraft:snowball",tag:{CustomModelData:42195},Count:1},NoGravity:1b,PickupDelay:32767s}
        summon minecraft:item ~ ~ ~ {Tags:[satyrn.fdl.trades.item,satyrn.fdl.trades.workItem],Item:{id:"minecraft:snowball",tag:{CustomModelData:42195},Count:1},NoGravity:1b,PickupDelay:32767s}
    }

    # Add trades to the wandering trader.
    execute as @e[type=minecraft:wandering_trader,tag=!satyrn.fdl.trades.maxTradesSet] at @s run {
        # Get the number of trades to add.
        macro random 1 5
        scoreboard players operation @s satyrn.fdl.tradesToAdd.grabBag = #random <%config.internalScoreboard%>

        macro random 2 5
        scoreboard players operation @s satyrn.fdl.tradesToAdd.head = #random <%config.internalScoreboard%>

        macro random 0 2
        scoreboard players operation @s satyrn.fdl.tradesToAdd.mythicItems = #random <%config.internalScoreboard%>

        tag @s add satyrn.fdl.trades.maxTradesSet
    }

    execute as @e[type=minecraft:wandering_trader,tag=!satyrn.fdl.trades.hasTrades.grabBag] at @s run function foxcraft_dungeon_loot:trades/add_grab_bag_trades
    execute as @e[type=minecraft:wandering_trader,tag=!satyrn.fdl.trades.hasTrades.head,tag=satyrn.fdl.trades.hasTrades.grabBag] at @s run function foxcraft_dungeon_loot:trades/add_head_trades
    execute as @e[type=minecraft:wandering_trader,tag=!satyrn.fdl.trades.hasTrades.mythicItems,tag=satyrn.fdl.trades.hasTrades.grabBag,tag=satyrn.fdl.trades.hasTrades.head] at @s run function foxcraft_dungeon_loot:trades/add_mythic_trades


    # Prevent the trader from moving until the trades are completely filled
    effect give @e[type=minecraft:wandering_trader,tag=!satyrn.fdl.trades.hasTrades] minecraft:slowness 1 255 true

    execute as @e[type=minecraft:wandering_trader,tag=satyrn.fdl.trades.hasTrades,tag=!satyrn.fdl.trades.complete] at @s if entity @e[type=minecraft:item,tag=satyrn.fdl.trades.item,limit=2,sort=nearest,distance=..0.5] run {
        kill @e[type=minecraft:item,tag=satyrn.fdl.trades.item,limit=2,sort=nearest,distance=..0.5]

        LOOP(4,i) {
            scoreboard players set @s satyrn.fdl.selectedTrade <%22+i%>
            function foxcraft_dungeon_loot:trades/add_trade
        }
        LOOP(2, i) {
            scoreboard players set @s satyrn.fdl.selectedTrade <%79+i%>
            function foxcraft_dungeon_loot:trades/add_trade
        }

        macro random 0 1
        execute if score #random <%config.internalScoreboard%> matches 1 run {
            scoreboard players set @s satyrn.fdl.selectedTrade 78
            function foxcraft_dungeon_loot:trades/add_trade
        }

        !IF(!config.dev) {
            scoreboard players reset @s
        }
        tag @s add satyrn.fdl.trades.complete
    }
}

function add_grab_bag_trades {
    scoreboard players add @s[tag=satyrn.fdl.trades.success] satyrn.fdl.tradesAdded.grabBag 1

    execute if score @s satyrn.fdl.tradesAdded.grabBag >= @s satyrn.fdl.tradesToAdd.grabBag run {
        tag @s add satyrn.fdl.trades.hasTrades.grabBag
    }

    tag @s[tag=!satyrn.fdl.trades.hasTrades.grabBag] remove satyrn.fdl.trades.success

    # Randomize trade to add
    scoreboard players add @s satyrn.fdl.selectedTrade 1

    execute at @s[tag=!satyrn.fdl.trades.success,tag=!satyrn.fdl.trades.hasTrades.grabBag] as @e[type=minecraft:item,distance=..0.5,tag=satyrn.fdl.trades.workItem] run function foxcraft_dungeon_loot:trades/check_existing_trades

    execute as @s[tag=satyrn.fdl.trades.success,tag=!satyrn.fdl.trades.hasTrades.grabBag] run {
        execute as @e[type=minecraft:item,distance=..0.5,tag=satyrn.fdl.trades.mainItem] run {
            execute store result entity @s Item.tag.CurrentTrade int 1 run scoreboard players get @e[type=minecraft:wandering_trader,sort=nearest,limit=1] satyrn.fdl.selectedTrade
            data modify entity @s Item.tag.AddedTrades append from entity @s Item.tag.CurrentTrade
        }
        function foxcraft_dungeon_loot:trades/add_trade
    }
}

function add_head_trades {
    execute if score @s satyrn.fdl.tradesAdded.head >= @s satyrn.fdl.tradesToAdd.head run {
        tag @s add satyrn.fdl.trades.hasTrades.head
    }

    tag @s[tag=!satyrn.fdl.trades.hasTrades.head] remove satyrn.fdl.trades.success

    # Randomize trade to add
    macro random 6 21
    scoreboard players operation @s satyrn.fdl.selectedTrade = #random <%config.internalScoreboard%>

    execute at @s[tag=!satyrn.fdl.trades.success,tag=!satyrn.fdl.trades.hasTrades.head] as @e[type=minecraft:item,distance=..0.5,tag=satyrn.fdl.trades.workItem] run function foxcraft_dungeon_loot:trades/check_existing_trades

    execute as @s[tag=satyrn.fdl.trades.success,tag=!satyrn.fdl.trades.hasTrades.head] run {
        execute as @e[type=minecraft:item,distance=..0.5,tag=satyrn.fdl.trades.mainItem] run {
            execute store result entity @s Item.tag.CurrentTrade int 1 run scoreboard players get @e[type=minecraft:wandering_trader,sort=nearest,limit=1] satyrn.fdl.selectedTrade
            data modify entity @s Item.tag.AddedTrades append from entity @s Item.tag.CurrentTrade
        }
        function foxcraft_dungeon_loot:trades/add_trade
    }
    scoreboard players add @s[tag=satyrn.fdl.trades.success] satyrn.fdl.tradesAdded.head 1
}


function add_mythic_trades {
    execute (if score @s satyrn.fdl.tradesToAdd.mythicItems matches 0) {
        tag @s add satyrn.fdl.trades.hasTrades.mythicItems
        tag @s add satyrn.fdl.trades.hasTrades
    } else {
        execute if score @s satyrn.fdl.tradesAdded.mythicItems >= @s satyrn.fdl.tradesToAdd.mythicItems run {
            tag @s add satyrn.fdl.trades.hasTrades.mythicItems
            tag @s add satyrn.fdl.trades.hasTrades
        }

        tag @s[tag=!satyrn.fdl.trades.hasTrades.mythicItems] remove satyrn.fdl.trades.success

        # Randomize trade to add
        macro random 26 77
        scoreboard players operation @s satyrn.fdl.selectedTrade = #random <%config.internalScoreboard%>

        execute at @s[tag=!satyrn.fdl.trades.success,tag=!satyrn.fdl.trades.hasTrades.mythicItems] as @e[type=minecraft:item,distance=..0.5,tag=satyrn.fdl.trades.workItem] run function foxcraft_dungeon_loot:trades/check_existing_trades

        execute as @s[tag=satyrn.fdl.trades.success,tag=!satyrn.fdl.trades.hasTrades.mythicItems] run {
            execute as @e[type=minecraft:item,distance=..0.5,tag=satyrn.fdl.trades.mainItem] run {
                execute store result entity @s Item.tag.CurrentTrade int 1 run scoreboard players get @e[type=minecraft:wandering_trader,sort=nearest,limit=1] satyrn.fdl.selectedTrade
                data modify entity @s Item.tag.AddedTrades append from entity @s Item.tag.CurrentTrade
            }
            function foxcraft_dungeon_loot:trades/add_trade
        }
        scoreboard players add @s[tag=satyrn.fdl.trades.success] satyrn.fdl.tradesAdded.mythicItems 1
    }
}

function check_existing_trades {
    data modify entity @s Item.tag.AddedTrades set from entity @e[type=minecraft:item,sort=nearest,limit=1,tag=satyrn.fdl.trades.mainItem] Item.tag.AddedTrades

    function foxcraft_dungeon_loot:trades/recursive_check_existing_trades

    # If the recursive check successfully stepped thru all items, the selected trade will be zero
    execute as @s[scores={satyrn.fdl.selectedTrade=0}] run {
        tag @e[type=minecraft:wandering_trader,sort=nearest,limit=1] add satyrn.fdl.trades.success
    }
}

function recursive_check_existing_trades {
    execute store result score @s satyrn.fdl.selectedTrade run data get entity @s Item.tag.AddedTrades[0]

    execute if score @e[type=minecraft:wandering_trader,sort=nearest,limit=1] satyrn.fdl.selectedTrade = @s satyrn.fdl.selectedTrade run {
        scoreboard players set @s satyrn.fdl.selectedTrade -1
    }

    data remove entity @s Item.tag.AddedTrades[0]

    execute if score @s satyrn.fdl.selectedTrade matches 1.. run function foxcraft_dungeon_loot:trades/recursive_check_existing_trades
}

function add_trade {
    data modify storage foxcraft_dungeon_loot:trades Recipe set value {rewardExp:0b,maxUses:3,buy:{id:"minecraft:emerald",Count:1b},buyB:{id:"minecraft:air",Count:1b},sell:{id:"minecraft:wandering_trader_spawn_egg",Count:1b}}

    execute (if score @s satyrn.fdl.selectedTrade matches 1) {
        macro loot_trade_setup items/common_grab_bag
        macro loot_buy_setup loot/coin/silver_coins
        macro randomize_trade_uses 3 5
        macro randomize_trade_cost 1 3
        macro random_partial_secondary_cost loot/coin/copper_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 2) {
        macro loot_trade_setup items/uncommon_grab_bag
        macro loot_buy_setup loot/coin/silver_coins
        macro randomize_trade_uses 2 4
        macro randomize_trade_cost 4 6
        macro random_partial_secondary_cost loot/coin/copper_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 3) {
        macro loot_trade_setup items/rare_grab_bag
        macro loot_buy_setup loot/coin/silver_coins
        macro randomize_trade_uses 1 3
        macro randomize_trade_cost 7 9
        macro random_partial_secondary_cost loot/coin/copper_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 4) {
        macro loot_trade_setup items/epic_grab_bag
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_uses 1 2
        macro set_trade_price 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 5) {
        macro loot_trade_setup items/mythic_grab_bag
        macro loot_buy_setup loot/coin/gold_coins
        macro set_trade_uses 1
        macro set_trade_price 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 6) {
        macro loot_trade_setup loot/heads/analogouspants5_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 7) {
        macro loot_trade_setup loot/heads/bored_kitsune_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 8) {
        macro loot_trade_setup loot/heads/bubbles199bla_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 9) {
        macro loot_trade_setup loot/heads/captainzephyrr_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 10) {
        macro loot_trade_setup loot/heads/chickenny127_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 11) {
        macro loot_trade_setup loot/heads/commandercyclops_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 12) {
        macro loot_trade_setup loot/heads/fyermine_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 13) {
        macro loot_trade_setup loot/heads/gunnystryker_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 14) {
        macro loot_trade_setup loot/heads/macedonzero_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 15) {
        macro loot_trade_setup loot/heads/maximumchocobo_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 16) {
        macro loot_trade_setup loot/heads/saturniidae_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 17) {
        macro loot_trade_setup loot/heads/saturniidev_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 18) {
        macro loot_trade_setup loot/heads/shrinerh_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 19) {
        macro loot_trade_setup loot/heads/shrinerh2_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 20) {
        macro loot_trade_setup loot/heads/underbrush_fox_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 21) {
        macro loot_trade_setup loot/heads/yergaderga2_head
        macro loot_buy_setup loot/coin/copper_coins
        macro randomize_trade_cost 1 9
    } else execute (if score @s satyrn.fdl.selectedTrade matches 22) {
        macro loot_trade_setup loot/coin/silver_coins
        macro loot_buy_setup loot/coin/copper_coins
        macro set_trade_price 10
        macro set_trade_uses 2147483647
    } else execute (if score @s satyrn.fdl.selectedTrade matches 23) {
        macro loot_trade_setup loot/coin/copper_coins
        macro loot_buy_setup loot/coin/silver_coins
        macro set_trade_count 10
        macro set_trade_uses 2147483647
    } else execute (if score @s satyrn.fdl.selectedTrade matches 24) {
        macro loot_trade_setup loot/coin/gold_coins
        macro loot_buy_setup loot/coin/silver_coins
        macro set_trade_price 10
        macro set_trade_uses 2147483647
    } else execute (if score @s satyrn.fdl.selectedTrade matches 25) {
        macro loot_trade_setup loot/coin/silver_coins
        macro loot_buy_setup loot/coin/gold_coins
        macro set_trade_count 10
        macro set_trade_uses 2147483647
    } else execute (if score @s satyrn.fdl.selectedTrade matches 26) {
        macro loot_trade_setup items/mythic/auto_pickaxe
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 27) {
        macro loot_trade_setup items/mythic/bringer_of_fear
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 28) {
        macro loot_trade_setup items/mythic/constantines_gift
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 29) {
        macro loot_trade_setup items/mythic/deilonas_holy_blessings
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 30) {
        macro loot_trade_setup items/mythic/downpour_amulet
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 31) {
        macro loot_trade_setup items/mythic/evokers_tome
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 32) {
        macro loot_trade_setup items/mythic/gravilock_boots
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 33) {
        macro loot_trade_setup items/mythic/hammer_of_sol
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 34) {
        macro loot_trade_setup items/mythic/how_about_no
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 35) {
        macro loot_trade_setup items/mythic/idol_of_melimonas
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 36) {
        macro loot_trade_setup items/mythic/pierce_the_sky
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 37) {
        macro loot_trade_setup items/mythic/poncho_sanchezs_fate
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 38) {
        macro loot_trade_setup items/mythic/pride_and_extreme_prejudice
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 39) {
        macro loot_trade_setup items/mythic/quet_zalas_beloved
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 40) {
        macro loot_trade_setup items/mythic/scripture_of_cleansing
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 41) {
        macro loot_trade_setup items/mythic/shield_of_the_juggernaut
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 42) {
        macro loot_trade_setup items/mythic/stompies
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 43) {
        macro loot_trade_setup items/mythic/talking_stick
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 44) {
        macro loot_trade_setup items/mythic/totem_of_deilona
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 45) {
        macro loot_trade_setup items/mythic/totem_of_dendris
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 46) {
        macro loot_trade_setup items/mythic/totem_of_ekila
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 47) {
        macro loot_trade_setup items/mythic/totem_of_gnumoch
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 48) {
        macro loot_trade_setup items/mythic/totem_of_mysteria
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 49) {
        macro loot_trade_setup items/mythic/war_hogs_burning_rage
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 50) {
        macro loot_trade_setup items/mythic/war_hogs_disdainful_pride
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 51) {
        macro loot_trade_setup items/mythic/war_hogs_festering_wrath
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 52) {
        macro loot_trade_setup items/mythic/war_hogs_insatiable_hunger
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 53) {
        macro loot_trade_setup items/mythic/war_hogs_lingering_spite
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 54) {
        macro loot_trade_setup items/mythic/war_hogs_seething_hatred
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 55) {
        macro loot_trade_setup items/mythic/wing_of_ouet_zala
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 56) {
        macro loot_trade_setup items/mythic/wing_of_quet_zala
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 57) {
        macro loot_trade_setup items/mythic/x_no_evil
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 5 10
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 58) {
        macro loot_trade_setup items/epic/dawncleaver
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 59) {
        macro loot_trade_setup items/epic/estudinaes_guidance
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 60) {
        macro loot_trade_setup items/epic/estudinaes_patience
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 61) {
        macro loot_trade_setup items/epic/estudinaes_script
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 62) {
        macro loot_trade_setup items/epic/estudinaes_sorrow
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 63) {
        macro loot_trade_setup items/epic/estudinaes_survival
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 64) {
        macro loot_trade_setup items/epic/fortune_500
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 65) {
        macro loot_trade_setup items/epic/heros_amulet
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 66) {
        macro loot_trade_setup items/epic/kobolds_vengeance
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 67) {
        macro loot_trade_setup items/epic/love_wheat
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 68) {
        macro loot_trade_setup items/epic/melimonas_guile
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 69) {
        macro loot_trade_setup items/epic/palominas_gift
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 70) {
        macro loot_trade_setup items/epic/peerless_yewhewn
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 71) {
        macro loot_trade_setup items/epic/rogues_dagger
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 72) {
        macro loot_trade_setup items/epic/silverfish_escape_artist
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 73) {
        macro loot_trade_setup items/epic/skullbasher
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 74) {
        macro loot_trade_setup items/epic/spell_scroll_hail_of_arrows
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 75) {
        macro loot_trade_setup items/epic/torenhias_fist
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 76) {
        macro loot_trade_setup items/epic/wand_of_block_state_editing
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 77) {
        macro loot_trade_setup items/epic/yo_yo_mans_revenge
        macro loot_buy_setup loot/coin/gold_coins
        macro randomize_trade_cost 1 4
        macro set_trade_uses 1
        macro random_partial_secondary_cost loot/coin/silver_coins
    } else execute (if score @s satyrn.fdl.selectedTrade matches 78) {
        macro loot_trade_setup loot/coin/silver_coins
        macro loot_buy_setup loot/coin/electrum_coins
        macro set_trade_price 1
        macro set_trade_uses 2147483647
        macro randomize_trade_count 3 7
    } else execute (if score @s satyrn.fdl.selectedTrade matches 79) {
        macro loot_trade_setup loot/coin/platinum_coins
        macro loot_buy_setup loot/coin/gold_coins
        macro set_trade_price 10
        macro set_trade_uses 2147483647
    } else execute (if score @s satyrn.fdl.selectedTrade matches 80) {
        macro loot_trade_setup loot/coin/gold_coins
        macro loot_buy_setup loot/coin/platinum_coins
        macro set_trade_count 10
        macro set_trade_uses 2147483647
    }

    # Append the recipe to the trader's recipe list
    data modify entity @s Offers.Recipes append from storage foxcraft_dungeon_loot:trades Recipe
}

function set_sell_from_item {
    data modify storage foxcraft_dungeon_loot:trades Recipe.sell set from entity @s Item
    kill @s
}

function set_buy_from_item {
    data modify storage foxcraft_dungeon_loot:trades Recipe.buy set from entity @s Item
    kill @s
}

function set_buyb_from_item {
    data modify storage foxcraft_dungeon_loot:trades Recipe.buyB set from entity @s Item
    kill @s
}
