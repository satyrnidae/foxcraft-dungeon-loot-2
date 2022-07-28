import ../../macros.mcm

# Clock that executes every 10 ticks.
function clock_10t {
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_10t 10t
    execute as @a at @s if score @s satyrn.fdl.itemId.boots matches 33 run {
        # This is probably faster than an NBT scan, right?
        execute store success score #test <%config.internalScoreboard%> run effect clear @s minecraft:levitation
        # Check if we successfully cleared the levitation effect
        execute if score #test <%config.internalScoreboard%> matches 1 run {
            # NBT scan is only performed when levitation effect is removed.
            execute (if score @s satyrn.fdl.custom.onGround matches 1) {
                playsound foxcraft_dungeon_loot:item.gravilock_boots.spark player @s ~ ~ ~ 1.0 1.0
            } else {
                playsound foxcraft_dungeon_loot:item.gravilock_boots.zap player @s ~ ~ ~ 1.0 0.5
            }
            # Spawn a particle effect at the player's feet
            particle minecraft:effect ~ ~ ~ 0.1 0 0.1 0.25 5

            # NBT Scan is probably better here than in the main tick.
            execute if entity @s[nbt=!{playerGameType:1}] run {
                # NBT scan needed to determine the amount of damage to apply to the boots.
                execute (if entity @s[nbt={Inventory:[{Slot:100b,id:"minecraft:iron_boots"}]}]) {
                    item modify entity @s armor.feet foxcraft_dungeon_loot:gravilock_boots/damage_iron
                    execute if entity @s[nbt={Inventory:[{Slot:100b,tag:{Damage:195}}]}] run {
                        macro break_item armor.feet minecraft:iron_boots{CustomModelData:421953}
                    }
                } else execute (if entity @s[nbt={Inventory:[{Slot:100b,id:"minecraft:diamond_boots"}]}]) {
                    item modify entity @s armor.feet foxcraft_dungeon_loot:gravilock_boots/damage_diamond
                    execute if entity @s[nbt={Inventory:[{Slot:100b,tag:{Damage:429}}]}] run {
                        macro break_item armor.feet minecraft:diamond_boots{CustomModelData:421953}
                    }
                } else {
                    # We'll just assume this is netherite to save on NBT scans.
                    item modify entity @s armor.feet foxcraft_dungeon_loot:gravilock_boots/damage_netherite
                    execute if entity @s[nbt={Inventory:[{Slot:100b,tag:{Damage:481}}]}] run {
                        macro break_item armor.feet minecraft:netherite_boots{CustomModelData:421953}
                    }
                }
            }
        }
    }
}

# Clock that executes every 2 seconds.
function clock_2s {
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_2s 2s
    execute as @a if score @s satyrn.fdl.itemId.boots matches 33 run effect give @s minecraft:slowness 3 1 true
}

# Gives the sender a copy of the item.
function give {
    give @s minecraft:iron_boots{DungeonLootId:33,CustomModelData:421953,AttributeModifiers:[{AttributeName:"generic.armor",Amount:3,Slot:feet,Name:"generic.armor",UUID:[I;-122620,37037,171513,-74074]},{AttributeName:"generic.armor_toughness",Amount:3,Slot:feet,Name:"generic.armor_toughness",UUID:[I;-122620,37137,171513,-74274]}],display:{Name:'[{"text":"Albatross Heavy Industries® GraviLock™ Boots","italic":false,"color":"green"}]',Lore:['[{"text":"Keep those feet on the ground, right","italic":false}]','[{"text":"where they belong.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Magnetic Stabilizers:","italic":false,"color":"green"},{"text":" Renders the user","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"immune to levitation effects.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:vanishing_curse",lvl:1},{id:"minecraft:feather_falling",lvl:5},{id:"minecraft:mending",lvl:1},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:5}]} 1
}

dir give {
    # Gives the sender a copy of the item. The item is upgraded to diamond.
    function diamond {
        give @s minecraft:diamond_boots{DungeonLootId:33,CustomModelData:421953,AttributeModifiers:[{AttributeName:"generic.armor",Amount:3,Slot:feet,Name:"generic.armor",UUID:[I;-122620,37037,171513,-74074]},{AttributeName:"generic.armor_toughness",Amount:3,Slot:feet,Name:"generic.armor_toughness",UUID:[I;-122620,37137,171513,-74274]}],display:{Name:'[{"text":"Albatross Heavy Industries® GraviLock™ Boots","italic":false,"color":"green"}]',Lore:['[{"text":"Keep those feet on the ground, right","italic":false}]','[{"text":"where they belong.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Magnetic Stabilizers:","italic":false,"color":"green"},{"text":" Renders the user","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"immune to levitation effects.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:vanishing_curse",lvl:1},{id:"minecraft:feather_falling",lvl:5},{id:"minecraft:mending",lvl:1},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:5}]} 1
    }

    # Gives the sender a copy of the item. The item is upgraded to netherite.
    function netherite {
        give @s minecraft:netherite_boots{DungeonLootId:33,CustomModelData:421953,AttributeModifiers:[{AttributeName:"generic.armor",Amount:3,Slot:feet,Name:"generic.armor",UUID:[I;-122620,37037,171513,-74074]},{AttributeName:"generic.armor_toughness",Amount:3,Slot:feet,Name:"generic.armor_toughness",UUID:[I;-122620,37137,171513,-74274]}],display:{Name:'[{"text":"Albatross Heavy Industries® GraviLock™ Boots","italic":false,"color":"green"}]',Lore:['[{"text":"Keep those feet on the ground, right","italic":false}]','[{"text":"where they belong.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Magnetic Stabilizers:","italic":false,"color":"green"},{"text":" Renders the user","color":"gray"},{"text":"","color":"dark_purple"}]','[{"text":"immune to levitation effects.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:vanishing_curse",lvl:1},{id:"minecraft:feather_falling",lvl:5},{id:"minecraft:mending",lvl:1},{id:"minecraft:protection",lvl:4},{id:"minecraft:unbreaking",lvl:5}]} 1
    }
}

# Schedules the item's clock functions.
function on_load {
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_10t 4t
    schedule function foxcraft_dungeon_loot:items/gravilock_boots/clock_2s 5t
}
