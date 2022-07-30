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

Additional shoutouts go to Link2_thepast's [Custom Music Discs](https://www.reddit.com/r/Minecraft/comments/picmad/my_datapack_lets_you_add_lots_of_custom_music/) datapack generator, though generated code was not imported into this pack.

Older commits of assets may include a set of custom music disc sound files which are mixed-down mono versions of Wolfgun's album [RUNNING](https://wolfgun.bandcamp.com/album/running). These files are excluded in more recent versions. The album can be downloaded for free or at any price through Wolfgun's Bandcamp page, and I highly recommend doing so.
