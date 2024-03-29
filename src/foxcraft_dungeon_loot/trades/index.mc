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
    data modify storage foxcraft_dungeon_loot:trades Version set value "<%config.version%>"
    data modify storage foxcraft_dungeon_loot:trades Index set value []
    data modify storage foxcraft_dungeon_loot:trades Current set value {}

    execute in minecraft:the_end positioned 264 64 264 run {
        tellraw @a {"text":"Building trade index...","color":"gray"}

# Grab Bags 0-4
        # Trade Index 0: Grab-Bag
        function foxcraft_dungeon_loot:trades/recipes/new
        macro set_sell_from_loot foxcraft_dungeon_loot:items/common_grab_bag
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/silver_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coins/copper_coins
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 1: Glistering Grab-Bag
        macro set_sell_from_loot foxcraft_dungeon_loot:items/uncommon_grab_bag
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 2: Sparkling Grab-Bag
        macro set_sell_from_loot foxcraft_dungeon_loot:items/rare_grab_bag
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 3: Shining Grab-Bag
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic_grab_bag
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/gold_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coins/silver_coins
        macro set_buy_price 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 4: Shining Grab-Bag
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic_grab_bag
        macro set_max_uses 1
        function foxcraft_dungeon_loot:trades/recipes/push

# Heads 5-20
        # Trade Index 5: AnalogousPants5 head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/analogouspants5_head
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/copper_coins
        macro set_buyb_item_id "minecraft:air"
        macro set_max_uses 3
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 6: Bored Kitsune head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/bored_kitsune_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 7: Bubbles199bla head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/bubbles199bla_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 8: CaptainZephyrr head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/captainzephyrr_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 9: chickenny127 head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/chickenny127_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 10: commandercyclops head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/commandercyclops_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 11: fyermine head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/fyermine_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 12: GunnyStryker head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/gunnystryker_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 13: MacedonZero head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/macedonzero_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 14: MaximumChocobo head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/maximumchocobo_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 15: satyrnidae head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/satyrnidae_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 16: saturniidev head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/saturniidev_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 17: shrinerh head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/shrinerh_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 18: shrinerh2 head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/shrinerh2_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 19: Underbrush Fox head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/underbrush_fox_head
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 20: Yergaderga2 head
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/heads/yergaderga2_head
        function foxcraft_dungeon_loot:trades/recipes/push

# Exchange 21-27
        # Trade Index 21: Exchange copper for silver
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coins/silver_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/copper_coins
        macro set_buy_price 10
        macro set_max_uses 2147483647
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 22: Exchange silver for copper
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coins/copper_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/silver_coins
        macro set_buy_price 1
        macro set_sell_count 10
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 23: Exchange silver for gold
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coins/gold_coins
        macro set_buy_price 10
        macro set_sell_count 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 24: Exchange gold for silver
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coins/silver_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/gold_coins
        macro set_buy_price 1
        macro set_sell_count 10
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 25: Exchange gold for platinum
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coins/platinum_coins
        macro set_buy_price 10
        macro set_sell_count 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 26: Exchange platinum for gold
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coins/gold_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/platinum_coins
        macro set_buy_price 1
        macro set_sell_count 10
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 27: Exchange electrum for silver
        macro set_sell_from_loot foxcraft_dungeon_loot:loot/coins/silver_coins
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/electrum_coins
        macro set_max_uses 64
        macro set_sell_count 5
        function foxcraft_dungeon_loot:trades/recipes/push

# Mythic Items 28-61
        # Trade Index 28: Albatross Heavy Industries Auto-Pickaxe
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/auto_pickaxe
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/platinum_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coins/gold_coins
        macro set_buy_price 1
        macro set_buyb_price 1
        macro set_max_uses 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 29: Bringer of Fear
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/bringer_of_fear
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 30: Constantine's Gift
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/constantines_gift
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 31: Deilona's Holy Blessings
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/deilonas_holy_blessings
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 32: Downpour Amulet
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/downpour_amulet
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 33: Evoker's Tome
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/evokers_tome
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 34: Gravilock Boots
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/gravilock_boots
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 35: Hammer of Sol
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/hammer_of_sol
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 36: How About No?
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/how_about_no
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 37: Idol of Melimonas
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/idol_of_melimonas
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 38: Pierce the Sky
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/pierce_the_sky
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 39: Poncho Sanchez's Fate
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/poncho_sanchezs_fate
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 40: Pride and Extreme Prejudice
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/pride_and_extreme_prejudice
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 41: Quet-Zala's Beloved
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/quet_zalas_beloved
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 42: Scripture of Cleansing
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/scripture_of_cleansing
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 43: Shield of the Juggernaut
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/shield_of_the_juggernaut
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 44: ST0MP-EE5
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/stompies
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 45: Talking Stick
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/talking_stick
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 46: Totem of Deilona
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_deilona
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 47: Totem of Dendris
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_dendris
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 48: Totem of Ekila
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_ekila
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 49: Totem of Gnumoch
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_gnumoch
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 50: Totem of Mysteria
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/totem_of_mysteria
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 51: War Hog's Burning Rage
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_burning_rage
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 52: War Hog's Disdainful Pride
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_disdainful_pride
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 53: War Hog's Festering Wrath
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_festering_wrath
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 54: War Hog's Insatiable Hunger
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_insatiable_hunger
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 55: War Hog's Lingering Spite
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_lingering_spite
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 56: War Hog's Seething Hatred
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_seething_hatred
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 57: Wing of Ouet-Zala
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/wing_of_ouet_zala
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 58: Wing of Quet-Zala
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/wing_of_quet_zala
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 59: X No Evil
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/x_no_evil
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 60: LumberJACKED chainsaw
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/chainsaw
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 61: War Hog's Blighted Harvest
        macro set_sell_from_loot foxcraft_dungeon_loot:items/mythic/war_hogs_blighted_harvest
        function foxcraft_dungeon_loot:trades/recipes/push

# Epic Items 62-82
        # Trade Index 62: Buckwheat
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/buckwheat
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/gold_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coins/silver_coins
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 63: Dawncleaver
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/dawncleaver
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 64: Estudinae's Guidance
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_guidance
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 65: Estudinae's Patience
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_patience
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 66: Estudinae's Script
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_script
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 67: Estudinae's Sorrow
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_sorrow
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 68: Estudinae's Survival
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/estudinaes_survival
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 69: Fortune 500
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/fortune_500
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 70: Hero's Amulet
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/heros_amulet
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 71: Kobold's Vengeance
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/kobolds_vengeance
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 72: Melimonas' Guile
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/melimonas_guile
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 73: Palomina's Gift
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/palominas_gift
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 74: Peerless Yewhewn
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/peerless_yewhewn
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 75: Rogue's Dagger
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/rogues_dagger
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 76: Silverfish Escape Artist
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/silverfish_escape_artist
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 77: Skullbasher
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/skullbasher
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 78: Spell Scroll: Hail of Arrows
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/spell_scroll_hail_of_arrows
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 79: Tor'Enhia's Fist
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/torenhias_fist
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 80: Wand of Block State Editing
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/wand_of_block_state_editing
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 81: Yo-Yo Man's Revenge
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/yo_yo_mans_revenge
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 82: Tithe to Uthiir
        macro set_sell_from_loot foxcraft_dungeon_loot:items/epic/tithe_to_uthiir
        function foxcraft_dungeon_loot:trades/recipes/push

# Copper Goat Horns 83-92
        # Trade Index 83: Clear Temper Journey
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/clear_temper_journey
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/copper_coins
        macro set_buyb_item_id "minecraft:goat_horn"
        macro set_buyb_price 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 84: Dry Urge Anger
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/dry_urge_anger
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 85: Fearless River Gift
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/fearless_river_gift
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 86: Fresh Nest Thought
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/fresh_nest_thought
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 87: Great Sky Falling
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/great_sky_falling
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 88: Mumble Fire Memory
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/mumble_fire_memory
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 89: Old Hymn Resting
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/old_hymn_resting
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 90: Pure Water Desire
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/pure_water_desire
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 91: Secret Lake Tear
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/secret_lake_tear
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 92: Sweet Moon Love
        macro set_sell_from_loot foxcraft_dungeon_loot:goat_horns/sweet_moon_love
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 93: Nether Star
        macro set_sell_from_loot foxcraft_dungeon_loot:util/reset
        macro set_sell_item_id "minecraft:nether_star"
        macro set_buy_from_loot foxcraft_dungeon_loot:loot/coins/platinum_coins
        macro set_buyb_from_loot foxcraft_dungeon_loot:loot/coins/gold_coins
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 94: End Crystal
        macro set_sell_item_id "minecraft:end_crystal"
        macro set_sell_count 1
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 95: Dragon Head
        macro set_sell_item_id "minecraft:dragon_head"
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 96: Dragon Egg
        macro set_sell_item_id "minecraft:dragon_egg"
        function foxcraft_dungeon_loot:trades/recipes/push

        # Trade Index 97: Sculk Catalyst
        macro set_sell_item_id "minecraft:sculk_catalyst"
        function foxcraft_dungeon_loot:trades/recipes/push


        tellraw @a {"text":"Trade index built!","color":"gray"}
        schedule function foxcraft_dungeon_loot:trades/index/release_chunk 1t
    }
}

function release_chunk {
    execute in minecraft:the_end run forceload remove 264 264

    schedule function foxcraft_dungeon_loot:trades/scheduled_tick 1t
}
