import net.minecraft.SharedConstants;
import net.minecraft.core.*;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.RegistryDataLoader;
import net.minecraft.server.Bootstrap;
import net.minecraft.server.packs.PackLocationInfo;
import net.minecraft.server.packs.PackResources;
import net.minecraft.server.packs.PackType;
import net.minecraft.server.packs.PathPackResources;
import net.minecraft.server.packs.repository.PackSource;
import net.minecraft.server.packs.repository.ServerPacksSource;
import net.minecraft.server.packs.resources.MultiPackResourceManager;
import net.minecraft.tags.TagLoader;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.core.LogEvent;
import org.apache.logging.log4j.core.Logger;
import org.apache.logging.log4j.core.appender.AbstractAppender;
import org.apache.logging.log4j.core.config.Property;

import java.nio.file.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Loads the pack the way the game does when it validates a datapack: the vanilla data plus the repo as a directory pack,
 * through the tag loader and RegistryDataLoader. Loot tables, item modifiers, predicates and the tags they reference are
 * read with the registry codecs, so a modifier file that is a bare list, a tag naming an id that no longer exists or a
 * stale tag reference fails here with the game's own message. Scan alone misses these because it uses the lenient direct
 * codecs. The game logs most of these as ERROR and carries on, so every ERROR logged during the load fails the check.
 * Usage: PackLoad PACK_DIR   (the folder that holds data/ and pack.mcmeta)
 */
public class PackLoad {
    static final List<String> errors = new CopyOnWriteArrayList<>();

    static void captureErrors() {
        Logger root = (Logger) LogManager.getRootLogger();
        AbstractAppender appender = new AbstractAppender("packload", null, null, true, Property.EMPTY_ARRAY) {
            @Override public void append(LogEvent e) {
                if (e.getLevel().isMoreSpecificThan(Level.ERROR)) {
                    String msg = e.getMessage().getFormattedMessage();
                    if (e.getThrown() != null) msg += " " + e.getThrown();
                    errors.add(msg);
                }
            }
        };
        appender.start();
        root.addAppender(appender);
    }

    public static void main(String[] args) throws Exception {
        SharedConstants.tryDetectVersion();
        Bootstrap.bootStrap();
        captureErrors();

        Path repo = Path.of(args[0]).toAbsolutePath();
        PackLocationInfo info = new PackLocationInfo("repo", Component.literal("repo"), PackSource.WORLD, Optional.empty());
        List<PackResources> packs = List.<PackResources>of(ServerPacksSource.createVanillaPackSource().fullResources(), new PathPackResources(info, repo));

        try (MultiPackResourceManager manager = new MultiPackResourceManager(PackType.SERVER_DATA, packs)) {
            // Tags of the built-in registries: block, item, entity type, fluid and so on.
            RegistryAccess.Frozen builtIn = RegistryAccess.fromRegistryOfRegistries(BuiltInRegistries.REGISTRY);
            var pending = TagLoader.loadTagsForExistingRegistries(manager, builtIn);
            List<HolderLookup.RegistryLookup<?>> lookups = new ArrayList<>(TagLoader.buildUpdatedLookups(builtIn, pending));

            // Worldgen layer next, loot functions and predicates look up enchantments, biomes and so on.
            RegistryAccess.Frozen world = RegistryDataLoader.load(manager, lookups, RegistryDataLoader.WORLD_REGISTRIES, Runnable::run).join();
            world.registries().forEach(e -> lookups.add(e.value()));
            RegistryAccess.Frozen reloadable = RegistryDataLoader.load(manager, lookups, RegistryDataLoader.RELOADABLE_REGISTRIES, Runnable::run).join();

            int count = (int) reloadable.registries().mapToLong(e -> e.value().size()).sum();
            Bootstrap.STDOUT.println("PackLoad: loaded " + count + " reloadable entries from " + repo);
        } catch (Exception e) {
            errors.add(e.toString());
            Throwable c = e;
            while (c.getCause() != null) { c = c.getCause(); errors.add("caused by: " + c); }
        }

        if (!errors.isEmpty()) {
            Bootstrap.STDOUT.println("PackLoad FAILED, " + errors.size() + " errors:");
            for (String s : errors) {
                for (String line : s.split("R")) {
                    if (!line.startsWith("	at ") && !line.startsWith("	... ")) Bootstrap.STDOUT.println("  " + (line.length() > 300 ? line.substring(0, 300) + "..." : line));
                }
            }
            System.exit(1);
        }
    }
}
