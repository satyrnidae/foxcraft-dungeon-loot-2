# Foxcraft Dungeon Loot 2
Customized Dungeon Loot for Minecraft 1.19

## Introduction
This datapack was first created as an attempt to add unique, modded-esque loot to the chests in the [Oh The Dungeons You'll Go](https://www.spigotmc.org/resources/delete.76437/) plugin.
(The plugin is now unfortunately discontinued.)
This rewrite aims to make the datapack more performant on old, slow CPUs like the one running the private server this datapack was designed for.

## Dungeon Loot IDs
Each custom item in this datapack is differentiated with a custom NBT entry "DungeonLootId".
The ID is an integer value, and must be unique for each item added to the pack.
A full list of IDs and item variants can be found in this [Google Sheets doc](https://docs.google.com/spreadsheets/d/1D1TzzwDPTOE9j0DODrGn77efJVp3Yn1HTM-r4AIuPHE/edit?usp=sharing).

## Building the Project
This project uses MC-Build to simplify creating the massive number of mcfunctions needed to handle all of the unique item interactions.
Follow their install instructions here: https://mcbuild.dev/docs/

After cloning this repository, run `mcb` in the directory to generate the functions.

## Acknowledgements
This pack contains code derived from utility packs and examples provided by [CloudWolf](https://www.youtube.com/c/CloudWolfMinecraft) and [WASD Build Team](https://www.youtube.com/c/WASDBuildTeam), as well as code derived from Siscu's [Evoker Charm](https://www.planetminecraft.com/data-pack/evoker-charm-functions-datapack/download/file/14409645/) datapack.

Some items are loosely based on the potions from Greymerk's wonderful [Roguelike](https://github.com/Greymerk/minecraft-roguelike) mod.

### Wolfgun
Older commits of assets may include a set of custom music disc sound files which are mixed-down mono versions of Wolfgun's album [RUNNING](https://wolfgun.bandcamp.com/album/running). These files are excluded in more recent versions. The album can be downloaded for free or at any price through Wolfgun's Bandcamp page, and I highly recommend doing so.

### Freesound
Some sound effects were downloaded from Freesound.org. Those are listed here:
 - [Electric zap](https://freesound.org/people/michael_grinnell/sounds/512471/) by michael_grinnell, CC-0
 - [Spark](https://freesound.org/people/elliott.klein/sounds/189630/) by elliot.klein, CC-0
 - [Sword Block](https://freesound.org/people/LukeSharples/sounds/209096/) and [Sword Block 2](https://freesound.org/people/LukeSharples/sounds/209099/) by LukeSharples (CC-BY)
 - [Chainsaw Idle Loops](https://freesound.org/people/Audionautics/sounds/171652/) by Audionautics (CC-BY)
 - [Chainsaw Start Attempts.wav](https://freesound.org/people/lonemonk/sounds/185580/) by lonemonk (CC-BY)

## Other Acknowledgements
Chainsaw shutdown sound created with [AngeTheGreat's engine simulator](https://github.com/ange-yaghi/engine-sim), though it is only a placeholder for now.
