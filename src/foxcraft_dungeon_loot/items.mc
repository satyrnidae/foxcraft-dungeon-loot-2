import ../macros.mcm

# Dungeon Loot ID: 1
dir peerless_yewhewn {
    function give {
        macro give_as_loot epic/peerless_yewhewn
    }
}

# Dungeon Loot ID: 2
dir dawncleaver {
    function give {
        macro give_as_loot epic/dawncleaver
    }

    dir give {
        function diamond {
            macro give_as_variant_loot epic/dawncleaver 1
        }

        function netherite {
            macro give_as_variant_loot epic/dawncleaver 2
        }
    }
}

# Dungeon Loot ID: 3
dir melimonas_guile {
    function give {
        macro give_as_loot epic/melimonas_guile
    }
}

# Dungeon Loot ID: 4
dir kobolds_vengeance {
    function give {
        macro give_as_loot epip/kobolds_vengeance
    }
}

# Dungeon Loot ID: 5
dir palominas_gift {
    function give {
        macro give_as_loot epic/palominas_gift
    }
}

# Dungeon Loot ID: 6
dir skullbasher {
    function give {
        macro give_as_loot epic/skullbasher
    }
}

# Dungeon Loot ID: 7
dir pierce_the_sky {
    function give {
        macro give_as_loot mythic/pierce_the_sky
    }
}

# Dungeon Loot ID: 8
dir yo_yo_mans_revenge {
    function give {
        macro give_as_loot epic/yo_yo_mans_revenge
    }
}

dir war_hogs_lingering_spite {
    function give {
        macro give_as_loot mythic/war_hogs_lingering_spite
    }
}

dir longsword {
    function give {
        macro give_as_loot rare/longsword
    }

    dir give {
        function diamond {
            macro give_as_variant_loot rare/longsword 1
        }
        function netherite {
            macro give_as_variant_loot rare/longsword 2
        }
    }
}

dir admire_me_from_afar {
    function give {
        macro give_as_loot rare/admire_me_from_afar
    }
}

dir quickdraw_crossbow {
    function give {
        macro give_as_loot rare/quickdraw_crossbow
    }
}

dir war_hogs_festering_wrath {
    function give {
        macro give_as_loot mythic/war_hogs_festering_wrath
    }
}

dir armor_of_the_golem {
    function give {
        macro give_as_loot rare/armor_of_the_golem
    }
}

dir shroud_of_notoriety {
    function give {
        macro give_as_loot rare/shroud_of_notoriety
    }
}

dir shield_of_the_juggernaut {
    function give {
        macro give_as_loot mythic/shield_of_the_juggernaut
    }
}


dir aurelias_lucky_compass {
    function give {
        give @s compass{DungeonLootId:18,AttributeModifiers:[{AttributeName:"generic.luck",Amount:2,Slot:offhand,Name:"generic.luck",UUID:[I;-122527,353760,12513,-707520]},{AttributeName:"generic.luck",Amount:2,Slot:mainhand,Name:"generic.luck",UUID:[I;-122527,353860,12513,-707720]}],display:{Name:'[{"text":"Aurelia\'s Lucky Compass","italic":false,"color":"aqua"}]',Lore:['[{"text":"Find yourself some nice booty.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Rare","color":"aqua","italic":true}]']},Enchantments:[{id:mending,lvl:1}],HideFlags:1} 1
    }
}

dir totem_of_undying {
    function give {
        give @s totem_of_undying{DungeonLootId:21,display:{Name:'[{"text":"Totem of Undying","italic":false,"color":"yellow"}]',Lore:['[{"text":"Pick yourself up and try again.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']}} 1
    }
}

dir fortune_500 {
    function give {
        give @s minecraft:iron_pickaxe{DungeonLootId:22,display:{Name:'[{"text":"Fortune 5","italic":false,"color":"light_purple"},{"text":"00","strikethrough":true}]',Lore:['[{"text":"One of those famous top-rated ","italic":true},{"text":"companies","strikethrough":true,"italic":true},{"text":"","strikethrough":false}]','[{"text":"pickaxes that everyone is talking about.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple","italic":true}]']},Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:fortune",lvl:5},{id:"minecraft:mending",lvl:1},{id:"minecraft:unbreaking",lvl:5}]} 1
    }

    dir give {
        function diamond {
            give @s minecraft:diamond_pickaxe{DungeonLootId:22,display:{Name:'[{"text":"Fortune 5","italic":false,"color":"light_purple"},{"text":"00","strikethrough":true}]',Lore:['[{"text":"One of those famous top-rated ","italic":true},{"text":"companies","strikethrough":true,"italic":true},{"text":"","strikethrough":false}]','[{"text":"pickaxes that everyone is talking about.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple","italic":true}]']},Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:fortune",lvl:5},{id:"minecraft:mending",lvl:1},{id:"minecraft:unbreaking",lvl:5}]} 1
        }

        function netherite {
            give @s minecraft:netherite_pickaxe{DungeonLootId:22,display:{Name:'[{"text":"Fortune 5","italic":false,"color":"light_purple"},{"text":"00","strikethrough":true}]',Lore:['[{"text":"One of those famous top-rated ","italic":true},{"text":"companies","strikethrough":true,"italic":true},{"text":"","strikethrough":false}]','[{"text":"pickaxes that everyone is talking about.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple","italic":true}]']},Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:fortune",lvl:5},{id:"minecraft:mending",lvl:1},{id:"minecraft:unbreaking",lvl:5}]} 1
        }
    }
}

dir copper_plated_pickaxe {
    function give {
        give @s minecraft:stone_pickaxe{DungeonLootId:23,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Pickaxe","italic":false,"color":"yellow"}]',Lore:['[{"text":"...Well that\'s odd.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
    }

    dir give {
        function iron {
            give @s minecraft:iron_pickaxe{DungeonLootId:23,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Pickaxe","italic":false,"color":"yellow"}]',Lore:['[{"text":"...Well that\'s odd.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function diamond {
            give @s minecraft:diamond_pickaxe{DungeonLootId:23,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Pickaxe","italic":false,"color":"yellow"}]',Lore:['[{"text":"...Well that\'s odd.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }
        function netherite {
            give @s minecraft:netherite_pickaxe{DungeonLootId:23,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Pickaxe","italic":false,"color":"yellow"}]',Lore:['[{"text":"...Well that\'s odd.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }
    }
}

dir copper_plated_axe {
    function give {
        give @s minecraft:stone_axe{DungeonLootId:24,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Axe","italic":false,"color":"yellow"}]',Lore:['[{"text":"No really, what is this.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
    }

    dir give {
        function iron {
            give @s minecraft:iron_axe{DungeonLootId:24,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Axe","italic":false,"color":"yellow"}]',Lore:['[{"text":"No really, what is this.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function diamond {
            give @s minecraft:diamond_axe{DungeonLootId:24,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Axe","italic":false,"color":"yellow"}]',Lore:['[{"text":"No really, what is this.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function netherite {
            give @s minecraft:netherite_axe{DungeonLootId:24,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Axe","italic":false,"color":"yellow"}]',Lore:['[{"text":"No really, what is this.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }
    }
}

dir copper_plated_hoe {
    function give {
        give @s minecraft:stone_hoe{DungeonLootId:25,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Hoe","italic":false,"color":"yellow"}]',Lore:['[{"text":"These are just recolored stone, right?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
    }

    dir give {
        function iron {
            give @s minecraft:iron_hoe{DungeonLootId:25,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Hoe","italic":false,"color":"yellow"}]',Lore:['[{"text":"These are just recolored stone, right?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function diamond {
            give @s minecraft:diamond_hoe{DungeonLootId:25,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Hoe","italic":false,"color":"yellow"}]',Lore:['[{"text":"These are just recolored stone, right?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function netherite {
            give @s minecraft:netherite_hoe{DungeonLootId:25,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Hoe","italic":false,"color":"yellow"}]',Lore:['[{"text":"These are just recolored stone, right?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }
    }
}

dir copper_plated_shovel {
    function give {
        give @s minecraft:stone_shovel{DungeonLootId:26,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Shovel","italic":false,"color":"yellow"}]',Lore:['[{"text":"Do these even melt down into copper?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
    }

    dir give {
        function iron {
            give @s minecraft:iron_shovel{DungeonLootId:26,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Shovel","italic":false,"color":"yellow"}]',Lore:['[{"text":"Do these even melt down into copper?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function diamond {
            give @s minecraft:diamond_shovel{DungeonLootId:26,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Shovel","italic":false,"color":"yellow"}]',Lore:['[{"text":"Do these even melt down into copper?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function netherite {
            give @s minecraft:netherite_shovel{DungeonLootId:26,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Shovel","italic":false,"color":"yellow"}]',Lore:['[{"text":"Do these even melt down into copper?","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }
    }
}

dir copper_plated_sword {
    function give {
        give @s minecraft:stone_sword{DungeonLootId:27,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Sword","italic":false,"color":"yellow"}]',Lore:['[{"text":"I guess it makes a nice display piece, at least.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
    }

    dir give {
        function iron {
            give @s minecraft:iron_sword{DungeonLootId:27,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Sword","italic":false,"color":"yellow"}]',Lore:['[{"text":"I guess it makes a nice display piece, at least.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function diamond {
            give @s minecraft:diamond_sword{DungeonLootId:27,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Sword","italic":false,"color":"yellow"}]',Lore:['[{"text":"I guess it makes a nice display piece, at least.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }

        function netherite {
            give @s minecraft:netherite_sword{DungeonLootId:27,CustomModelData:421952,display:{Name:'[{"text":"Copper-Plated Sword","italic":false,"color":"yellow"}]',Lore:['[{"text":"I guess it makes a nice display piece, at least.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Uncommon","color":"yellow","italic":true}]']},Enchantments:[{id:"minecraft:unbreaking",lvl:1}]} 1
        }
    }
}

dir war_hogs_burning_rage {
    function give {
        give @s minecraft:netherite_axe{DungeonLootId:28,AttributeModifiers:[{AttributeName:"generic.attack_speed",Amount:1.6,Slot:mainhand,Name:"generic.attack_speed",UUID:[I;-12265,51337,155536,-102674]},{AttributeName:"generic.attack_damage",Amount:15,Slot:mainhand,Name:"generic.attack_damage",UUID:[I;-12265,51437,155536,-102874]}],display:{Name:'[{"text":"War Hog\'s Burning Rage","italic":false,"color":"green"}]',Lore:['[{"text":"In a time long past, fearsome warriors","italic":true}]','[{"text":"roamed the Nether. This axe is their","italic":true}]','[{"text":"burning rage.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Mythic","color":"green","italic":true}]']},Enchantments:[{id:"minecraft:fire_aspect",lvl:3},{id:"minecraft:impaling",lvl:3},{id:"minecraft:mending",lvl:1},{id:"minecraft:sharpness",lvl:6},{id:"minecraft:unbreaking",lvl:5}]} 1
    }
}

dir lucky_rabbits_foot {
    function give {
        give @s minecraft:rabbit_foot{DungeonLootId:29,AttributeModifiers:[{AttributeName:"generic.luck",Amount:4,Slot:mainhand,Name:"generic.luck",UUID:[I;-12266,26162,195544,-52324]},{AttributeName:"generic.luck",Amount:4,Slot:offhand,Name:"generic.luck",UUID:[I;-12266,26262,195544,-52524]}],display:{Name:'[{"text":"Lucky Rabbit\'s Foot","italic":false,"color":"aqua"}]',Lore:['[{"text":"You\'d honestly think these would just"}]','[{"text":"do this normally.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Rare","color":"aqua"}]']},Enchantments:[{id:"minecraft:mending",lvl:1}],HideFlags:1} 1
    }
}

dir estudinaes_script {
    function give {
        give @s minecraft:leather_leggings{DungeonLootId:30,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Script","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Poncho Sanchez do not forget"}]','[{"text":"their pain.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,19437,171513,-38874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:swift_sneak",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    dir give {
        function chainmail {
            give @s minecraft:chainmail_leggings{DungeonLootId:30,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Script","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Poncho Sanchez do not forget"}]','[{"text":"their pain.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,19437,171513,-38874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:swift_sneak",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
        }

        function iron {
            give @s minecraft:iron_leggings{DungeonLootId:30,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Script","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Poncho Sanchez do not forget"}]','[{"text":"their pain.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,19437,171513,-38874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:swift_sneak",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
        }

        function diamond {
            give @s minecraft:diamond_leggings{DungeonLootId:30,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Script","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Poncho Sanchez do not forget"}]','[{"text":"their pain.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,19437,171513,-38874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:swift_sneak",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
        }

        function netherite {
            give @s minecraft:netherite_leggings{DungeonLootId:30,CustomModelData:421951,display:{color:5215783,Name:'[{"text":"Estudinae\'s Script","italic":false,"color":"light_purple"}]',Lore:['[{"text":"Survivors of Poncho Sanchez do not forget"}]','[{"text":"their pain.","italic":true},{"text":"","italic":false}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"}]']},AttributeModifiers:[{AttributeName:"generic.luck",Amount:1,Slot:feet,Name:"generic.luck",UUID:[I;-122620,19437,171513,-38874]}],Enchantments:[{id:"minecraft:blast_protection",lvl:4},{id:"minecraft:depth_strider",lvl:3},{id:"minecraft:fire_protection",lvl:4},{id:"minecraft:mending",lvl:1},{id:"minecraft:projectile_protection",lvl:4},{id:"minecraft:protection",lvl:4},{id:"minecraft:swift_sneak",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
        }
    }
}

dir estudinaes_sorrow {
    function give {
        give @s minecraft:diamond_sword{DungeonLootId:31,Tags:["potion.target.wither=1","potion.self.nausea=0"],display:{Name:'[{"text":"Estudinae\'s Sorrow","italic":false,"color":"light_purple"}]',Lore:['[{"text":"A weapon wielded by Guardians of Dinidae during"}]','[{"text":"their battle with Poncho Sanchez. Their lack of","italic":true}]','[{"text":"natural desire for combat had... unintended","italic":true}]','[{"text":"consequences.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Regret:","italic":false,"color":"light_purple"},{"text":" ","color":"dark_purple"},{"text":"Damaging an enemy will apply","color":"gray"}]','[{"text":"Wither II to them, but also apply Nausea to","italic":false,"color":"gray"}]','[{"text":"yourself.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:knockback",lvl:5},{id:"minecraft:luck_of_the_sea",lvl:10},{id:"minecraft:mending",lvl:1},{id:"minecraft:sharpness",lvl:5},{id:"minecraft:smite",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
    }

    dir give {
        function netherite {
            give @s minecraft:netherite_sword{DungeonLootId:31,Tags:["potion.target.wither=1","potion.self.nausea=0"],display:{Name:'[{"text":"Estudinae\'s Sorrow","italic":false,"color":"light_purple"}]',Lore:['[{"text":"A weapon wielded by Guardians of Dinidae during"}]','[{"text":"their battle with Poncho Sanchez. Their lack of","italic":true}]','[{"text":"natural desire for combat had... unintended","italic":true}]','[{"text":"consequences.","italic":true}]','[{"text":"Rarity: ","italic":true},{"text":"Epic","color":"light_purple"},{"text":"","color":"dark_purple","italic":false}]','[{"text":"","italic":false,"color":"dark_purple"}]','[{"text":"Estudinae\'s Regret:","italic":false,"color":"light_purple"},{"text":" ","color":"dark_purple"},{"text":"Damaging an enemy will apply","color":"gray"}]','[{"text":"Wither II to them, but also apply Nausea to","italic":false,"color":"gray"}]','[{"text":"yourself.","italic":false,"color":"gray"}]']},Enchantments:[{id:"minecraft:knockback",lvl:5},{id:"minecraft:luck_of_the_sea",lvl:10},{id:"minecraft:mending",lvl:1},{id:"minecraft:sharpness",lvl:5},{id:"minecraft:smite",lvl:3},{id:"minecraft:unbreaking",lvl:3}]} 1
        }
    }
}

dir armor_stand {
    function give {
        give @s armor_stand{CustomModelData:421950,display:{Lore:['[{"text":"Pose: None","italic":false,"color":"gray"}]']},EntityTag:{ShowArms:1b}} 1
    }

    dir give {
        function baby {
            give @s armor_stand{CustomModelData:421950,display:{Name:'[{"text":"Armor Stand","italic":false},{"text":" (Baby)","color":"gray","italic":false}]',Lore:['[{"text":"Pose: Baby","italic":false,"color":"gray"}]']},EntityTag:{ShowArms:1b,Small:1b}} 1
        }

        function bashful {
            give @s armor_stand{CustomModelData:421950,display:{Name:'[{"text":"Armor Stand","italic":false},{"text":" (Bashful)","color":"gray","italic":false}]',Lore:['[{"text":"Pose: Bashful","italic":false,"color":"gray"}]']},EntityTag:{ShowArms:1b,Pose:{RightArm:[30.0f,0.0f,-35.0f],Head:[20.0f,25.0f,15.0f],LeftArm:[30.0f,0.0f,35.0f],RightLeg:[10.0f,10.0f,0.0f],Body:[0.0f,3.8545465f,0.0f]}}} 1
        }

        function cancan {
            give @s armor_stand{CustomModelData:421950,display:{Name:'[{"text":"Armor Stand","italic":false},{"text":" (Can-Can)","color":"gray","italic":false}]',Lore:['[{"text":"Pose: Can-Can","italic":false,"color":"gray"}]']},EntityTag:{ShowArms:1b,Pose:{RightArm:[0.0f,0.0f,90.0f],LeftLeg:[-90.0f,0.0f,0.0f],Head: [0.0f,-15.0f,0.0f],LeftArm:[0.0f,0.0f,-90.0f],Body: [0.0f,15.0f,0.0f]}}} 1
        }

        function gallant {
            give @s armor_stand{CustomModelData:421950,display:{Name:'[{"text":"Armor Stand","italic":false},{"text":" (Gallant)","color":"gray","italic":false}]',Lore:['[{"text":"Pose: Gallant","italic":false,"color":"gray"}]']},EntityTag:{ShowArms:1b,Pose:{Head:[0f,45f,0f],RightArm:[-90f,45f,0f],LeftArm:[-25f,45f,-15f]}}} 1
        }

        function greyskull {
            give @s armor_stand{CustomModelData:421950,display:{Name:'[{"text":"Armor Stand","italic":false},{"text":" (Greyskull)","color":"gray","italic":false}]',Lore:['[{"text":"Pose: Greyskull","italic":false,"color":"gray"}]']},EntityTag:{ShowArms:1b,Pose:{Head:[-20.0f,75.0f,0.0f],RightArm:[-180.0f,110.0f,-50.0f]}}} 1
        }

        function skeleton {
            give @s armor_stand{CustomModelData:421950,display:{Name:'[{"text":"Armor Stand","italic":false},{"text":" (Skeleton)","color":"gray","italic":false}]',Lore:['[{"text":"Pose: Skeleton","italic":false,"color":"gray"}]']},EntityTag:{ShowArms:1b,Pose:{RightArm:[-90.0f,-10.0f,0.0f],Head:[1.4536514f,7.777254f,0.0f],LeftArm:[-90.0f,30.0f,0.0f],Body:[0.0f,0.22099066f,0.0f]}}} 1
        }

        function zombie {
            give @s armor_stand{CustomModelData:421950,display:{Name:'[{"text":"Armor Stand","italic":false},{"text":" (Zombie)","color":"gray","italic":false}]',Lore:['[{"text":"Pose: Zombie","italic":false,"color":"gray"}]']},EntityTag:{ShowArms:1b,Pose:{RightArm:[-90.0f,0.0f,0.0f],Head:[1.4536514f,7.777254f,0.0f],LeftArm:[-90.0f,0.0f,0.0f],Body:[0.0f,0.22099066f,0.0f]}}} 1
        }
    }
}
