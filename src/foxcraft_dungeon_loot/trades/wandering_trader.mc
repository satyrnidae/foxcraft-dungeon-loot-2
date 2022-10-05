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
    scoreboard objectives add satyrn.fdl.tradesToAdd.goatHorns dummy
    scoreboard objectives add satyrn.fdl.tradesAdded.goatHorns dummy
    scoreboard objectives add satyrn.fdl.selectedTrade dummy

    team add satyrn.fdl.traders "Wandering Traders"
    team modify satyrn.fdl.traders color dark_aqua
}

# Multi-tick function, adds trades to the wandering trader.
function on_tick {
    execute if entity @s[tag=!satyrn.fdl.wanderingTrader.initialized] run {
        tag @s add satyrn.fdl.wanderingTrader.initialized
        # Wandering trader "not spawned naturally" check
        execute store result score #test <%config.internalScoreboard%> run data get entity @s DespawnDelay

        execute (if score #test <%config.internalScoreboard%> matches 1..) {
            data merge entity @s {NoAI:1b,NoGravity:1b,DeathLootTable:"foxcraft_dungeon_loot:entities/wandering_trader"}

            execute as @e[type=minecraft:trader_llama,limit=2,sort=nearest,tag=!satyrn.fdl.wanderingTrader.llama,distance=..10] run {
                tag @s add satyrn.fdl.wanderingTrader.llama
                data merge entity @s {NoAI:1b,NoGravity:1b}
            }

            summon minecraft:armor_stand ~ ~ ~ {Invisible:<%config.dev?0:1%>b,Marker:1b,NoGravity:1b,Tags:[satyrn.fdl.wanderingTrader.tradeIndex],HandItems:[{id:"minecraft:snowball",tag:{CustomModelData:42195,AddedTrades:[],ScanTrades:[],CurrentTrade:0},Count:1}],HandDropChances:[0.00f]}

            macro random 4 5
            scoreboard players operation @s satyrn.fdl.tradesToAdd.grabBag = #math.result <%config.internalScoreboard%>
            !IF(config.dev) {
                scoreboard players set @s satyrn.fdl.tradesToAdd.grabBag 5
            }


            macro random 2 3
            scoreboard players operation @s satyrn.fdl.tradesToAdd.head = #math.result <%config.internalScoreboard%>
            !IF(config.dev) {
                scoreboard players set @s satyrn.fdl.tradesToAdd.head 3
            }

            macro random 0 2
            scoreboard players operation @s satyrn.fdl.tradesToAdd.dungeonLoot = #math.result <%config.internalScoreboard%>
            !IF(config.dev) {
                scoreboard players set @s satyrn.fdl.tradesToAdd.dungeonLoot 2
            }

            macro random 6 7
            scoreboard players operation @s satyrn.fdl.tradesToAdd.exchange = #math.result <%config.internalScoreboard%>
            !IF(config.dev) {
                scoreboard players set @s satyrn.fdl.tradesToAdd.exchange 7
            }

            macro random 0 3
            scoreboard players operation @s satyrn.fdl.tradesToAdd.goatHorns = #math.result <%config.internalScoreboard%>
            !IF(config.dev) {
                scoreboard players set @s satyrn.fdl.tradesToAdd.goatHorns 3
            }
        } else {
            tag @s add satyrn.fdl.trades.hasTrades.head
            tag @s add satyrn.fdl.trades.hasTrades.goatHorns
            tag @s add satyrn.fdl.trades.hasTrades.grabBag
            tag @s add satyrn.fdl.trades.hasTrades.dungeonLoot
            tag @s add satyrn.fdl.trades.hasTrades.exchange
            tag @s add satyrn.fdl.trades.hasTrades
        }
    }

    # Isabel 2022/10/04:
    #  So this is kind of annoying, but trade generation must use 1-indexed values instead of zero-indexed values, unless the
    #  function increments satyrn.fdl.selectedTrade after assigning it (exchange rates, grab bags).
    #  Just set the randomizer to 1-index values, as it's one argument less than incrementing the scoreboard immediately
    #  afterwards.

# Head trades
    execute (if entity @s[tag=!satyrn.fdl.trades.hasTrades.head]) {
        execute (if score @s satyrn.fdl.tradesAdded.head >= @s satyrn.fdl.tradesToAdd.head) {
            tag @s add satyrn.fdl.trades.hasTrades.head
        } else {
            tag @s remove satyrn.fdl.tradeAdded

            macro random 6 21
            scoreboard players operation @s satyrn.fdl.selectedTrade = #math.result <%config.internalScoreboard%>

            execute as @e[type=minecraft:armor_stand,tag=satyrn.fdl.wanderingTrader.tradeIndex,sort=nearest,limit=1] run function foxcraft_dungeon_loot:trades/wandering_trader/check_existing_trades

            execute if entity @s[tag=satyrn.fdl.tradeAdded] run {
                function foxcraft_dungeon_loot:trades/wandering_trader/append_current_trade_to_index
                function foxcraft_dungeon_loot:trades/wandering_trader/add_trade
                scoreboard players add @s satyrn.fdl.tradesAdded.head 1
            }
        }
# Goat Horns
    } else execute (unless entity @s[tag=satyrn.fdl.trades.hasTrades.goatHorns]) {
        execute (if score @s satyrn.fdl.tradesToAdd.goatHorns matches 0) {
            tag @s add satyrn.fdl.trades.hasTrades.goatHorns
        } else execute (if score @s satyrn.fdl.tradesAdded.goatHorns >= @s satyrn.fdl.tradesToAdd.goatHorns) {
            tag @s add satyrn.fdl.trades.hasTrades.goatHorns
        } else {
            tag @s remove satyrn.fdl.tradeAdded

            macro random 84 93
            scoreboard players operation @s satyrn.fdl.selectedTrade = #math.result <%config.internalScoreboard%>

            execute as @e[type=minecraft:armor_stand,tag=satyrn.fdl.wanderingTrader.tradeIndex,sort=nearest,limit=1] run function foxcraft_dungeon_loot:trades/wandering_trader/check_existing_trades

            execute if entity @s[tag=satyrn.fdl.tradeAdded] run {
                function foxcraft_dungeon_loot:trades/wandering_trader/append_current_trade_to_index
                function foxcraft_dungeon_loot:trades/wandering_trader/add_trade
                scoreboard players add @s satyrn.fdl.tradesAdded.goatHorns 1
            }
        }
# Grab Bag trades
    } else execute (if entity @s[tag=!satyrn.fdl.trades.hasTrades.grabBag]) {
        execute (if score @s satyrn.fdl.tradesAdded.grabBag >= @s satyrn.fdl.tradesToAdd.grabBag) {
            tag @s add satyrn.fdl.trades.hasTrades.grabBag
        } else {
            execute unless score @s satyrn.fdl.tradesAdded.grabBag matches 0.. run scoreboard players set @s satyrn.fdl.selectedTrade 0
            # Increments trades to add by one each time
            scoreboard players add @s satyrn.fdl.selectedTrade 1

            function foxcraft_dungeon_loot:trades/wandering_trader/add_trade

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
                macro random 63 83
            } else {
                macro random 29 62
            }
            scoreboard players operation @s satyrn.fdl.selectedTrade = #math.result <%config.internalScoreboard%>

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
            # Increments trades to add by one each time
            scoreboard players add @s satyrn.fdl.selectedTrade 1
            function foxcraft_dungeon_loot:trades/wandering_trader/add_trade
            scoreboard players add @s satyrn.fdl.tradesAdded.exchange 1
        }
# Finalize entity
    # Finalize the entity, cleaning up the tracker armor stand, etc. Since we don't enter this
    #   function after this tag is sent, should only be called once.
    } else execute (if entity @s[tag=!satyrn.fdl.trades.hasTrades]) {
        tag @s add satyrn.fdl.trades.hasTrades

        kill @e[tag=satyrn.fdl.wanderingTrader.tradeIndex,limit=1,sort=nearest]

        data merge entity @s {NoAI:0b,NoGravity:0b}

        scoreboard players reset @s

        execute as @e[tag=satyrn.fdl.wanderingTrader.llama,limit=2,sort=nearest,distance=..10] run {
            tag @s remove satyrn.fdl.wanderingTrader.llama
            data merge entity @s {NoAI:0b,NoGravity:0b}
            data modify entity @s Leash.UUID set from entity @e[type=minecraft:wandering_trader,limit=1,sort=nearest,distance=..5] UUID
            data modify entity @s Owner set from entity @e[type=minecraft:wandering_trader,limit=1,sort=nearest,distance=..5] UUID
        }

        execute if score trader.enableWelcomeMsg <%config.internalScoreboard%> matches 1 run {
            team join satyrn.fdl.traders @s

            execute store result score #x <%config.internalScoreboard%> run data get entity @s Pos[0]
            execute store result score #z <%config.internalScoreboard%> run data get entity @s Pos[2]

            effect give @s minecraft:glowing 10

            tag @s add satyrn.fdl.wanderingTrader.announce
            tellraw @a ["[",{"selector":"@s"},"] Hello! I offer exotic wares at fair prices. Find me near ",{"selector":"@p"},", at ",{"score":{"name":"#x","objective":"<%config.internalScoreboard%>"}},"x ",{"score":{"name":"#z","objective":"<%config.internalScoreboard%>"}},"z!"]
            execute as @a at @s facing entity @e[type=minecraft:wandering_trader,limit=1,tag=satyrn.fdl.wanderingTrader.announce] eyes run playsound minecraft:entity.wandering_trader.yes neutral @s ^ ^ ^1
            tag @s remove satyrn.fdl.wanderingTrader.announce
        }
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
    scoreboard objectives remove satyrn.fdl.tradesToAdd.goatHorns
    scoreboard objectives remove satyrn.fdl.tradesAdded.goatHorns

    team remove satyrn.fdl.traders
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
    # The recursive check continues if the trade number is zero, so satyrn.fdl.selectedTrade must be 1-indexed.
    execute store result score @s satyrn.fdl.selectedTrade run data get entity @s HandItems[0].tag.ScanTrades[0]

    execute if score @e[type=minecraft:wandering_trader,sort=nearest,limit=1] satyrn.fdl.selectedTrade = @s satyrn.fdl.selectedTrade run scoreboard players set @s satyrn.fdl.selectedTrade -127

    data remove entity @s HandItems[0].tag.ScanTrades[0]

    execute if score @s satyrn.fdl.selectedTrade matches 1.. run function foxcraft_dungeon_loot:trades/wandering_trader/recursive_check
}

function add_trade {
    # i value should loop through entire size of the trade index
    LOOP(93,i) {
        # i values are zero indexed but selectedTrade is 1-indexed. Add 1 to i in the check.
        execute if score @s satyrn.fdl.selectedTrade matches <%i+1%> run {
            macro get_offer_from_index <%i%>

            # Grab-Bag randomized pricing
            !IF(i==0) {
                macro randomize_max_uses 3 5
                macro randomize_buy_price 1 3
                macro randomize_buyb_price 0 9
            }

            # Glistering Grab-Bag randomized pricing
            !IF(i==1) {
                macro randomize_max_uses 2 4
                macro randomize_buy_price 4 6
                macro randomize_buyb_price 0 9
            }

            # Sparkling Grab-Bag randomized pricing
            !IF(i==2) {
                macro randomize_max_uses 1 3
                macro randomize_buy_price 7 9
                macro randomize_buyb_price 0 9
            }

            # Shining Grab-Bag randomized pricing
            !IF(i==3) {
                macro randomize_max_uses 1 2
                macro randomize_buy_price 1 4
                macro randomize_buyb_price 0 9
            }

            # Radiant Grab-Bag randomized pricing
            !IF(i==4) {
                macro randomize_buy_price 5 9
                macro randomize_buyb_price 0 9
            }

            # Player heads randomized pricing
            !IF(i>=5 && i<=20) {
                macro randomize_buy_price 1 9
            }

            # Randomize electrum value per silver
            !IF(i==27) {
                macro randomize_sell_count 1 10
            }

            # Mythic item random pricing
            !IF(i>=28 && i<=61) {
                macro randomize_buyb_price 0 9
            }

            # Epic item random pricing
            !IF(i>=62 && i<=82) {
                macro randomize_buy_price 1 9
                macro randomize_buyb_price 0 9
            }

            # Goat horn random pricing / exchange
            !IF(i>=83 && i<=92) {
                macro randomize_buy_price 1 3
                macro set_buyb_from_loot foxcraft_dungeon_loot:goat_horns/random_goat_horn
            }
        }
    }

    # Append the constructed recipe.
    data modify entity @s Offers.Recipes append from storage foxcraft_dungeon_loot:trades Current
}
