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
        macro give_as_loot rare/aurelias_lucky_compass
    }
}

dir totem_of_undying {
    function give {
        macro give_as_loot uncommon/totem_of_undying
    }
}

dir fortune_500 {
    function give {
        macro give_as_loot epic/fortune_500
    }

    dir give {
        function diamond {
            macro give_as_variant_loot epic/fortune_500 1
        }

        function netherite {
            macro give_as_variant_loot epic/fortune_500 2
        }
    }
}

dir copper_plated_pickaxe {
    function give {
        macro give_as_loot uncommon/copper_plated_pickaxe
    }

    dir give {
        function iron {
            macro give_as_variant_loot uncommon/copper_plated_pickaxe 1
        }

        function diamond {
            macro give_as_variant_loot uncommon/copper_plated_pickaxe 2
        }

        function netherite {
            macro give_as_variant_loot uncommon/copper_plated_pickaxe 3
        }
    }
}

dir copper_plated_axe {
    function give {
        macro give_as_loot uncommon/copper_plated_axe
    }

    dir give {
        function iron {
            macro give_as_variant_loot uncommon/copper_plated_axe 1
        }

        function diamond {
            macro give_as_variant_loot uncommon/copper_plated_axe 2
        }

        function netherite {
            macro give_as_variant_loot uncommon/copper_plated_axe 3
        }
    }
}

dir copper_plated_hoe {
    function give {
        macro give_as_loot uncommon/copper_plated_hoe
    }

    dir give {
        function iron {
            macro give_as_variant_loot uncommon/copper_plated_hoe 1
        }

        function diamond {
            macro give_as_variant_loot uncommon/copper_plated_hoe 2
        }

        function netherite {
            macro give_as_variant_loot uncommon/copper_plated_hoe 3
        }
    }
}

dir copper_plated_shovel {
    function give {
        macro give_as_loot uncommon/copper_plated_shovel
    }

    dir give {
        function iron {
            macro give_as_variant_loot uncommon/copper_plated_shovel 1
        }

        function diamond {
            macro give_as_variant_loot uncommon/copper_plated_shovel 2
        }

        function netherite {
            macro give_as_variant_loot uncommon/copper_plated_shovel 3
        }
    }
}

dir copper_plated_sword {
    function give {
        macro give_as_loot uncommon/copper_plated_sword
    }

    dir give {
        function iron {
            macro give_as_variant_loot uncommon/copper_plated_sword 1
        }

        function diamond {
            macro give_as_variant_loot uncommon/copper_plated_sword 2
        }

        function netherite {
            macro give_as_variant_loot uncommon/copper_plated_sword 3
        }
    }
}

dir war_hogs_burning_rage {
    function give {
        macro give_as_loot mythic/war_hogs_burning_rage
    }
}

dir lucky_rabbits_foot {
    function give {
        macro give_as_loot rare/lucky_rabbits_foot
    }
}

dir estudinaes_script {
    function give {
        macro give_as_loot epic/estudinaes_script
    }

    dir give {
        function chainmail {
            macro give_as_variant_loot epic/estudinaes_script 1
        }

        function iron {
            macro give_as_variant_loot epic/estudinaes_script 2
        }

        function diamond {
            macro give_as_variant_loot epic/estudinaes_script 3
        }

        function netherite {
            macro give_as_variant_loot epic/estudinaes_script 4
        }
    }
}

dir armor_stand {
    function give {
        macro give_as_loot common/armor_stand
    }

    dir give {
        function baby {
            macro give_as_loot common/armor_stand_baby
        }

        function bashful {
            macro give_as_loot common/armor_stand_bashful
        }

        function cancan {
            macro give_as_loot common/armor_stand_cancan
        }

        function gallant {
            macro give_as_loot common/armor_stand_gallant
        }

        function greyskull {
            macro give_as_loot common/armor_stand_greyskull
        }

        function skeleton {
            macro give_as_loot common/armor_stand_skeleton
        }

        function zombie {
            macro give_as_loot common/armor_stand_zombie
        }
    }
}
