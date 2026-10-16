import com.mojang.brigadier.*;
import com.mojang.brigadier.exceptions.CommandSyntaxException;
import net.minecraft.SharedConstants;
import net.minecraft.commands.*;
import net.minecraft.core.*;
import net.minecraft.data.registries.VanillaRegistries;
import net.minecraft.network.chat.Component;
import net.minecraft.server.Bootstrap;
import net.minecraft.server.permissions.LevelBasedPermissionSet;
import net.minecraft.world.phys.*;

import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

/**
 * Parses every command line of every .mcfunction under a folder with the game's own command dispatcher, so a renamed
 * argument or a wrong NBT path shows up without launching the game. Parse only: nothing is executed, and a path that
 * is syntactically valid but names a missing key is not caught. Usage: CmdCheck FUNCTION_DIR
 * Lines starting with $ (macros) are skipped. Needs the 26.3 client jar and Java 25, see tests/verifying-against-vanilla.md.
 */
public class CmdCheck {
    public static void main(String[] args) throws Exception {
        SharedConstants.tryDetectVersion();
        Bootstrap.bootStrap();
        HolderLookup.Provider lookup = VanillaRegistries.createReloadableLookup(VanillaRegistries.createWorldLookup());
        Commands commands = new Commands(Commands.CommandSelection.ALL, Commands.createValidationContext(lookup));
        CommandDispatcher<CommandSourceStack> d = commands.getDispatcher();
        CommandSourceStack src = new CommandSourceStack(CommandSource.NULL, Vec3.ZERO, Vec2.ZERO, null,
            LevelBasedPermissionSet.OWNER, Component.literal("check"), null);
        Path root = Paths.get(args[0]);
        int lines = 0, bad = 0, skipped = 0;
        List<Path> files;
        try (Stream<Path> s = Files.walk(root)) { files = s.filter(p -> p.toString().endsWith(".mcfunction")).sorted().collect(Collectors.toList()); }
        for (Path f : files) {
            int n = 0;
            for (String raw : Files.readAllLines(f)) {
                n++;
                String line = raw.strip();
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("$")) continue;
                lines++;
                String err = null;
                try {
                    ParseResults<CommandSourceStack> r = d.parse(line, src);
                    if (r.getReader().canRead()) {
                        err = r.getExceptions().isEmpty() ? "unparsed tail: " + r.getReader().getRemaining()
                            : r.getExceptions().values().iterator().next().getMessage();
                    } else if (r.getContext().getNodes().isEmpty()) err = "no node";
                    else if (!hasCommand(r)) err = "incomplete command";
                } catch (Exception ex) { err = ex.toString(); }
                // Loot tables, predicates, item modifiers and instruments of the pack are not in the vanilla registries; existence is checked elsewhere.
                if (err != null && (err.contains("Can't find element 'foxcraft_dungeon_loot:") || err.contains("Failed to get element foxcraft_dungeon_loot:"))) { skipped++; err = null; }
                if (err != null) { bad++; Bootstrap.STDOUT.println(root.relativize(f).toString().replace(java.io.File.separatorChar, '/') + ":" + n + ": " + err + "\n    " + line); }
            }
        }
        Bootstrap.STDOUT.println("files: " + files.size() + ", commands: " + lines + ", unresolved pack ids ignored: " + skipped + ", problems: " + bad);
        System.exit(bad == 0 ? 0 : 1);
    }

    static boolean hasCommand(ParseResults<CommandSourceStack> r) {
        var c = r.getContext();
        while (c.getChild() != null) c = c.getChild();
        return c.getCommand() != null;
    }
}
