import ../../macros.mcm
import ../trades.mcm

function on_load {
    scoreboard objectives add satyrn.fdl.tradesToAdd.grabBag dummy
    scoreboard objectives add satyrn.fdl.tradesAdded.grabBag dummy
    scoreboard objectives add satyrn.fdl.tradesToAdd.head dummy
    scoreboard objectives add satyrn.fdl.tradesAdded.head dummy
    scoreboard objectives add satyrn.fdl.tradesToAdd.dungeonLoot dummy
    scoreboard objectives add satyrn.fdl.tradesAdded.dungeonLoot dummy
    scoreboard objectives add satyrn.fdl.tradesToAdd.exchange dummy
    scoreboard objectives add satyrn.fdl.tradesAdded.exchange dummy
    scoreboard objectives add satyrn.fdl.selectedTrade dummy
}

# Multi-tick function, adds trades to the wandering trader.
function on_tick {
    execute if entity @s[tag=!satyrn.fdl.wanderingTrader.initialized] run {
        tag @s add satyrn.fdl.wanderingTrader.initialized
        data merge entity @s {NoAI:1b,NoGravity:1b}

        execute as @e[type=minecraft:trader_llama,limit=2,sort=nearest,tag=!satyrn.fdl.wanderingTrader.llama,distance=..3] run {
            tag @s add satyrn.fdl.wanderingTrader.llama
            data merge entity @s {NoAI:1b,NoGravity:1b}
        }

        summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Marker:1b,NoGravity:1b,Tags:[satyrn.fdl.wanderingTrader.tradeIndex],HandItems:[{id:"minecraft:snowball",tag:{CustomModelData:42195,AddedTrades:[],ScanTrades:[],CurrentTrade:0},Count:1}],HandDropChances:[0.00f]}

        macro random 3 5
        scoreboard players operation @s satyrn.fdl.tradesToAdd.grabBag = #random <%config.internalScoreboard%>

        macro random 2 3
        scoreboard players operation @s satyrn.fdl.tradesToAdd.head = #random <%config.internalScoreboard%>

        macro random 0 2
        scoreboard players operation @s satyrn.fdl.tradesToAdd.dungeonLoot = #random <%config.internalScoreboard%>

        macro random 6 7
        scoreboard players operation @s satyrn.fdl.tradesToAdd.exchange = #random <%config.internalScoreboard%>
    }

# Head trades
    execute (if entity @s[tag=!satyrn.fdl.trades.hasTrades.head]) {
        execute (if score @s satyrn.fdl.tradesAdded.head >= @s satyrn.fdl.tradesToAdd.head) {
            tag @s add satyrn.fdl.trades.hasTrades.head
        } else {
            tag @s remove satyrn.fdl.tradeAdded

            macro random 6 21
            scoreboard players operation @s satyrn.fdl.selectedTrade = #random <%config.internalScoreboard%>

            execute as @e[type=minecraft:armor_stand,tag=satyrn.fdl.wanderingTrader.tradeIndex,sort=nearest,limit=1] run function foxcraft_dungeon_loot:trades/wandering_trader/check_existing_trades

            execute if entity @s[tag=satyrn.fdl.tradeAdded] run {
                function foxcraft_dungeon_loot:trades/wandering_trader/append_current_trade_to_index
                function foxcraft_dungeon_loot:trades/wandering_trader/add_trade
                scoreboard players add @s satyrn.fdl.tradesAdded.head 1
            }
        }
# Grab Bag trades
    } else execute (if entity @s[tag=!satyrn.fdl.trades.hasTrades.grabBag]) {
        execute (if score @s satyrn.fdl.tradesAdded.grabBag >= @s satyrn.fdl.tradesToAdd.grabBag) {
            tag @s add satyrn.fdl.trades.hasTrades.grabBag
        } else {
            execute unless score @s satyrn.fdl.tradesAdded.grabBag matches 0.. run scoreboard players set @s satyrn.fdl.selectedTrade 0
            scoreboard players add @s satyrn.fdl.selectedTrade 1
            function foxcraft_dungeon_loot:trades/wandering_trader/add_trade
            # Increments trades to add by one each time
            scoreboard players add @s satyrn.fdl.tradesAdded.grabBag 1
        }
# Dungeon Loot Trades
    } else execute (if entity @s[tag=!satyrn.fdl.trades.hasTrades.dungeonLoot]) {
        execute (if score @s satyrn.fdl.tradesToAdd.dungeonLoot matches 0) {
            tag @s add satyrn.fdl.trades.hasTrades.dungeonLoot
        } else execute (if score @s satyrn.fdl.tradesAdded.dungeonLoot >= @s satyrn.fdl.tradesToAdd.dungeonLoot) {
            tag @s add satyrn.fdl.trades.hasTrades.dungeonLoot
        } else {
            tag @s remove satyrn.fdl.tradeAdded

            execute (unless score @s satyrn.fdl.tradesAdded.dungeonLoot matches 1..) {
                macro random 61 80
            } else {
                macro random 29 60
            }
            scoreboard players operation @s satyrn.fdl.selectedTrade = #random <%config.internalScoreboard%>

            execute as @e[type=minecraft:armor_stand,tag=satyrn.fdl.wanderingTrader.tradeIndex,sort=nearest,limit=1] run function foxcraft_dungeon_loot:trades/wandering_trader/check_existing_trades

            execute if entity @s[tag=satyrn.fdl.tradeAdded] run {
                function foxcraft_dungeon_loot:trades/wandering_trader/append_current_trade_to_index
                function foxcraft_dungeon_loot:trades/wandering_trader/add_trade
                scoreboard players add @s satyrn.fdl.tradesAdded.dungeonLoot 1
            }
        }
# Exchange Loot Trades
    } else execute (if entity @s[tag=!satyrn.fdl.trades.hasTrades.exchange]) {
        execute (if score @s satyrn.fdl.tradesAdded.exchange >= @s satyrn.fdl.tradesToAdd.exchange) {
            tag @s add satyrn.fdl.trades.hasTrades.exchange
        } else {
            execute unless score @s satyrn.fdl.tradesAdded.exchange matches 0.. run scoreboard players set @s satyrn.fdl.selectedTrade 21
            scoreboard players add @s satyrn.fdl.selectedTrade 1
            function foxcraft_dungeon_loot:trades/wandering_trader/add_trade
            # Increments trades to add by one each time
            scoreboard players add @s satyrn.fdl.tradesAdded.exchange 1
        }
# Finalize entity
    # Finalize the entity, cleaning up the tracker armor stand, etc. Since we don't enter this
    #   function after this tag is sent, should only be called once.
    } else execute (if entity @s[tag=!satyrn.fdl.trades.hasTrades]) {
        tag @s add satyrn.fdl.trades.hasTrades

        kill @e[tag=satyrn.fdl.wanderingTrader.tradeIndex,limit=1,sort=nearest]

        data merge entity @s {NoAI:0b,NoGravity:0b}

        execute as @e[tag=satyrn.fdl.wanderingTrader.llama,limit=2,sort=nearest,distance=..3] run {
            tag @s remove satyrn.fdl.wanderingTrader.llama
            data merge entity @s {NoAI:0b,NoGravity:0b}
        }

        scoreboard players reset @s
    }
}

function on_uninstall {
    scoreboard objectives remove satyrn.fdl.tradesToAdd.grabBag
    scoreboard objectives remove satyrn.fdl.tradesAdded.grabBag
    scoreboard objectives remove satyrn.fdl.tradesToAdd.head
    scoreboard objectives remove satyrn.fdl.tradesAdded.head
    scoreboard objectives remove satyrn.fdl.tradesToAdd.dungeonLoot
    scoreboard objectives remove satyrn.fdl.tradesAdded.dungeonLoot
    scoreboard objectives remove satyrn.fdl.selectedTrade
    scoreboard objectives remove satyrn.fdl.tradesToAdd.exchange
    scoreboard objectives remove satyrn.fdl.tradesAdded.exchange
}

function append_current_trade_to_index {
    execute as @e[tag=satyrn.fdl.wanderingTrader.tradeIndex,limit=1,sort=nearest] run {
        execute store result entity @s HandItems[0].tag.CurrentTrade int 1 run scoreboard players get @e[type=minecraft:wandering_trader,sort=nearest,limit=1] satyrn.fdl.selectedTrade
        data modify entity @s HandItems[0].tag.AddedTrades append from entity @s HandItems[0].tag.CurrentTrade
    }
}

function check_existing_trades {
    data modify entity @s HandItems[0].tag.ScanTrades set from entity @s HandItems[0].tag.AddedTrades

    function foxcraft_dungeon_loot:trades/wandering_trader/recursive_check

    execute if score @s satyrn.fdl.selectedTrade matches 0 run tag @e[type=minecraft:wandering_trader,sort=nearest,limit=1] add satyrn.fdl.tradeAdded
}

function recursive_check {
    execute store result score @s satyrn.fdl.selectedTrade run data get entity @s HandItems[0].tag.ScanTrades[0]

    execute if score @e[type=minecraft:wandering_trader,sort=nearest,limit=1] satyrn.fdl.selectedTrade = @s satyrn.fdl.selectedTrade run scoreboard players set @s satyrn.fdl.selectedTrade -127

    data remove entity @s HandItems[0].tag.ScanTrades[0]

    execute if score @s satyrn.fdl.selectedTrade matches 1.. run function foxcraft_dungeon_loot:trades/wandering_trader/recursive_check
}

function add_trade {
    LOOP(80,i) {
        execute if score @s satyrn.fdl.selectedTrade matches <%i+1%> run {
            macro get_offer_from_index <%i%>
            !IF(i==0) {
                # Grab-Bag custom pricing
                macro randomize_max_uses 3 5
                macro randomize_buy_price 1 3
                macro randomize_buyb_price 0 9
            }
            !IF(i==1) {
                # Glistering Grab-Bag custom pricing
                macro randomize_max_uses 2 4
                macro randomize_buy_price 4 6
                macro randomize_buyb_price 0 9
            }
            !IF(i==2) {
                # Sparkling Grab-Bag custom pricing
                macro randomize_max_uses 1 3
                macro randomize_buy_price 7 9
                macro randomize_buyb_price 0 9
            }
            !IF(i==3) {
                # Shining Grab-Bag custom pricing
                macro randomize_max_uses 1 2
                macro randomize_buy_price 1 4
                macro randomize_buyb_price 0 9
            }
            !IF(i==4) {
                # Radiant Grab-Bag custom pricing
                macro randomize_buy_price 5 9
                macro randomize_buyb_price 0 9
            }
            !IF(i>=5 && i<=20) {
                # Head custom pricing
                macro randomize_buy_price 1 9
            }
            !IF(i==27) {
                macro randomize_sell_count 3 7
            }
            # Exchange trades do not have custom pricing
            !IF(i>=28 && i <=59) {
                # Mythic item custom pricing
                macro randomize_buy_price 1 2
                macro randomize_buyb_price 0 9
            }
            !IF(i > 59) {
                # Epic items custom pricing
                macro randomize_buy_price 1 9
                macro randomize_buyb_price 0 9
            }
        }
    }

    # Append the constructed recipe.
    data modify entity @s Offers.Recipes append from storage foxcraft_dungeon_loot:trades Current
}
