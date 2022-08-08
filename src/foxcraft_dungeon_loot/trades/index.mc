import ../trades.mcm

function on_load {
    execute in minecraft:the_end run forceload add 264 264
    schedule function foxcraft_dungeon_loot:trades/index/wait_for_chunk 1t
}

function on_uninstall {
    data remove storage foxcraft_dungeon_loot:trades Index
    data remove storage foxcraft_dungeon_loot:trades Current
}

function wait_for_chunk {
    execute in minecraft:the_end positioned 264 64 264 run {
        summon minecraft:marker ~ ~ ~ {Tags:[satyrn.fdl.trade.index.chunkTest]}
        execute (unless entity @e[type=minecraft:marker,tag=satyrn.fdl.trade.index.chunkTest,distance=..0.5]) {
            schedule function foxcraft_dungeon_loot:trades/index/wait_for_chunk 1s
        } else {
            kill @e[type=minecraft:marker,tag=satyrn.fdl.trade.index.chunkTest]
            schedule function foxcraft_dungeon_loot:trades/index/build 1t
        }
    }
}

function build {
    data modify storage foxcraft_dungeon_loot:trades Index set value []
    data modify storage foxcraft_dungeon_loot:trades Current set value {}

    execute in minecraft:the_end positioned 264 64 264 run {
        tellraw @a {"text":"Building trade index...","color":"gray"}

# Grab Bags 1-5
        # Trade Index 1: Grab-Bag
        function foxcraft_dungeon_loot:trades/recipes/new
        macro set_sell_from_loot foxcraft_dungeon_loot:items/common_grab_bag
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/silver_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coin/copper_coins
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 2: Glistering Grab-Bag
        macro set_sell_from_loot foxcraft_dungeon_loot:items/uncommon_grab_bag
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 3: Sparkling Grab-Bag
        macro set_sell_from_loot foxcraft_dungeon_loot:items/rare_grab_bag
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 4: Shining Grab-Bag
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic_grab_bag
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/gold_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coin/silver_coins
        macro set_buy_price 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 5: Shining Grab-Bag
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic_grab_bag
        macro set_max_uses 1
        function foxcraft_dungeon_loot:trades/recipes/push

# Heads 6-21
        # Trade Index 6: AnalogousPants5 head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/analogouspants5_head
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/copper_coins
        macro set_buyb_item_id "minecraft:air"
        macro set_max_uses 3
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 7: Bored Kitsune head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/bored_kitsune_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 8: Bubbles199bla head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/bubbles199bla_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 9: CaptainZephyrr head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/captainzephyrr_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 10: chickenny127 head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/chickenny127_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 11: commandercyclops head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/commandercyclops_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 12: fyermine head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/fyermine_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 13: GunnyStryker head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/gunnystryker_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 14: MacedonZero head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/macedonzero_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 15: MaximumChocobo head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/maximumchocobo_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 16: satyrnidae head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/satyrnidae_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 17: saturniidev head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/saturniidev_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 18: shrinerh head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/shrinerh_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 19: shrinerh2 head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/shrinerh2_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 20: Underbrush Fox head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/underbrush_fox_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 21: Yergaderga2 head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/yergaderga2_head
        function foxcraft_dungeon_loot:trades/recipes/push

# Exchange 22-28
        # Trade Index 22: Exchange copper for silver
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coin/silver_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/copper_coins
        macro set_buy_price 10
        macro set_max_uses 2147483647
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 23: Exchange silver for copper
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coin/copper_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/silver_coins
        macro set_buy_price 1
        macro set_sell_count 10
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 24: Exchange silver for gold
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coin/gold_coins
        macro set_buy_price 10
        macro set_sell_count 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 25: Exchange gold for silver
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coin/silver_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/gold_coins
        macro set_buy_price 1
        macro set_sell_count 10
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 26: Exchange gold for platinum
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coin/platinum_coins
        macro set_buy_price 10
        macro set_sell_count 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 27: Exchange platinum for gold
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coin/gold_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/platinum_coins
        macro set_buy_price 1
        macro set_sell_count 10
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 28: Exchange electrum for silver
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coin/silver_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/electrum_coins
        macro set_max_uses 64
        macro set_sell_count 5
        function foxcraft_dungeon_loot:trades/recipes/push

# Mythic Items 29-60
        # Trade Index 29: Albatross Heavy Industries Auto-Pickaxe
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/auto_pickaxe
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/platinum_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coin/gold_coins
        macro set_buy_price 1
        macro set_buyb_price 1
        macro set_max_uses 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 30: Bringer of Fear
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/bringer_of_fear
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 31: Constantine's Gift
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/constantines_gift
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 32: Deilona's Holy Blessings
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/deilonas_holy_blessings
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 33: Downpour Amulet
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/downpour_amulet
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 34: Evoker's Tome
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/evokers_tome
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 35: Gravilock Boots
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/gravilock_boots
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 36: Hammer of Sol
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/hammer_of_sol
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 37: How About No?
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/how_about_no
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 38: Idol of Melimonas
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/idol_of_melimonas
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 39: Pierce the Sky
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/pierce_the_sky
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 40: Poncho Sanchez's Fate
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/poncho_sanchezs_fate
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 41: Pride and Extreme Prejudice
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/pride_and_extreme_prejudice
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 42: Quet-Zala's Beloved
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/quet_zalas_beloved
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 43: Scripture of Cleansing
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/scripture_of_cleansing
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 44: Shield of the Juggernaut
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/shield_of_the_juggernaut
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 45: ST0MP-EE5
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/stompies
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 46: Talking Stick
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/talking_stick
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 47: Totem of Deilona
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_deilona
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 48: Totem of Dendris
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_dendris
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 49: Totem of Ekila
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_ekila
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 50: Totem of Gnumoch
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_gnumoch
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 51: Totem of Mysteria
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_mysteria
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 52: War Hog's Burning Rage
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_burning_rage
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 53: War Hog's Disdainful Pride
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_disdainful_pride
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 54: War Hog's Festering Wrath
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_festering_wrath
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 55: War Hog's Insatiable Hunger
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_insatiable_hunger
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 56: War Hog's Lingering Spite
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_lingering_spite
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 57: War Hog's Seething Hatred
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_seething_hatred
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 58: Wing of Ouet-Zala
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/wing_of_ouet_zala
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 59: Wing of Quet-Zala
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/wing_of_quet_zala
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 60: X No Evil
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/x_no_evil
        function foxcraft_dungeon_loot:trades/recipes/push

# Epic Items 61-80
        # Trade Index 61: Buckwheat
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/buckwheat
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coin/gold_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coin/silver_coins
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 62: Dawncleaver
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/dawncleaver
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 63: Estudinae's Guidance
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_guidance
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 64: Estudinae's Patience
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_patience
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 65: Estudinae's Script
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_script
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 66: Estudinae's Sorrow
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_sorrow
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 67: Estudinae's Survival
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_survival
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 68: Fortune 500
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/fortune_500
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 69: Hero's Amulet
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/heros_amulet
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 70: Kobold's Vengeance
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/kobolds_vengeance
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 71: Melimonas' Guile
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/melimonas_guile
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 72: Palomina's Gift
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/palominas_gift
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 73: Peerless Yewhewn
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/peerless_yewhewn
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 74: Rogue's Dagger
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/rogues_dagger
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 75: Silverfish Escape Artist
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/silverfish_escape_artist
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 76: Skullbasher
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/skullbasher
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 77: Spell Scroll: Hail of Arrows
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/spell_scroll_hail_of_arrows
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 78: Tor'Enhia's Fist
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/torenhias_fist
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 79: Wand of Block State Editing
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/wand_of_block_state_editing
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 80: Yo-Yo Man's Revenge
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/yo_yo_mans_revenge
        function foxcraft_dungeon_loot:trades/recipes/push

        tellraw @a {"text":"Trade index built!","color":"gray"}
        schedule function foxcraft_dungeon_loot:trades/index/release_chunk 1t
    }
}

function release_chunk {
    execute in minecraft:the_end run forceload remove 264 264

    schedule function foxcraft_dungeon_loot:trades/scheduled_tick 1t
}
