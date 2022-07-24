# Gives the sender a copy of the item.
function give {
    give @s minecraft:golden_sword{DungeonLootId:17,Unbreakable:1,CustomModelData:421951,AttributeModifiers:[{AttributeName:"generic.attack_damage",Amount:4,Slot:offhand,Name:"generic.attack_damage",UUID:[I;-122527,287560,12513,-575120]},{AttributeName:"generic.attack_speed",Amount:0.6,Slot:offhand,Name:"generic.attack_speed",UUID:[I;-122527,287660,12513,-575320]},{AttributeName:"generic.movement_speed",Amount:0.1,Slot:offhand,Operation:1,Name:"generic.movement_speed",UUID:[I;-122527,287760,12513,-575520]},{AttributeName:"generic.attack_damage",Amount:4,Slot:mainhand,Name:"generic.attack_damage",UUID:[I;-122527,287860,12513,-575720]},{AttributeName:"generic.attack_speed",Amount:0.6,Slot:mainhand,Name:"generic.attack_speed",UUID:[I;-122527,287960,12513,-575920]}],display:{Name:'[{"text":"Rogue\'s Dagger","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Stabs so nice you\'ll stab it twice!","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple","italic":true}]','[{"text":"","italic":false}]','[{"text":"Sneaky, Sneaky:","italic":false,"color":"light_purple"},{"text":" ","color":"dark_purple"},{"text":"While sneaking with the Rogue\'s","color":"gray"}]','[{"text":"Dagger in your offhand, you gain Invisibility.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:vanishing_curse",lvl:1}]} 1
}

# Makes the player invisible if they are crouching.
function on_tick {
    execute if score @s satyrn.fdl.itemId.offHand matches 17 if score @s satyrn.fdl.custom.sneakTime matches 1.. run effect give @s minecraft:invisibility 1
}
