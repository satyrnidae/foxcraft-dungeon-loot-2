import com.google.gson.*;
import com.mojang.serialization.*;
import net.minecraft.SharedConstants;
import net.minecraft.advancements.Advancement;
import net.minecraft.core.*;
import net.minecraft.core.registries.*;
import net.minecraft.data.registries.VanillaRegistries;
import net.minecraft.resources.*;
import net.minecraft.server.Bootstrap;
import net.minecraft.world.item.Instrument;
import net.minecraft.world.item.JukeboxSong;
import net.minecraft.world.level.storage.loot.LootTable;
import net.minecraft.world.level.storage.loot.functions.LootItemFunction;
import net.minecraft.world.level.storage.loot.functions.LootItemFunctions;
import net.minecraft.world.level.storage.loot.predicates.LootItemCondition;

import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

/**
 * Parses every loot table, predicate, item modifier and advancement under a data directory with the game's own codecs,
 * re-encodes what the game kept, and reports any object key that appeared in the file but not in the re-encoded data.
 * Old keys parse without an error and are dropped, so a clean parse alone proves nothing. See tests/verifying-against-vanilla.md.
 * Usage: Scan DATA_DIR   (the folder that contains the namespace folders)
 */
public class Scan {
    static HolderLookup.Provider lookup;

    static void boot() {
        SharedConstants.tryDetectVersion();
        Bootstrap.bootStrap();
        lookup = VanillaRegistries.createReloadableLookup(VanillaRegistries.createWorldLookup());
        BuiltInRegistries.DATA_COMPONENT_INITIALIZERS.build(lookup).forEach(pc -> pc.apply());
    }

    static void out(String s) { Bootstrap.STDOUT.println(s); }

    /**
     * Keys the game legitimately re-encodes away: default values, comments, and the type/value pair of a constant number provider.
     * Counting them would bury real drops in noise.
     */
    static boolean benign(JsonObject o, String key, JsonElement value) {
        if (key.startsWith("__comment")) return true;
        if (key.equals("type") && value.isJsonPrimitive() && value.getAsString().equals("minecraft:generic") && o.has("pools")) return true;
        if (key.equals("weight") && value.isJsonPrimitive() && value.getAsString().equals("1")) return true;
        if (key.equals("quality") && value.isJsonPrimitive() && value.getAsString().equals("0")) return true;
        if (key.equals("add") && value.isJsonPrimitive() && value.getAsString().equals("false")) return true;
        if ((key.equals("announce_to_chat") || key.equals("show_toast")) && value.isJsonPrimitive() && value.getAsString().equals("true")) return true;
        if (key.equals("hidden") && value.isJsonPrimitive() && value.getAsString().equals("false")) return true;
        if (key.equals("frame") && value.isJsonPrimitive() && value.getAsString().equals("task")) return true;
        if (key.equals("text") && o.size() == 1) return true;
        if (key.equals("bonus_rolls") && value.isJsonPrimitive() && value.getAsJsonPrimitive().isNumber() && value.getAsDouble() == 0) return true;
        if (key.equals("rewards") && value.isJsonObject() && value.getAsJsonObject().size() == 0) return true;
        if (key.equals("pools") && value.isJsonArray() && value.getAsJsonArray().isEmpty()) return true;
        if ((key.equals("type") || key.equals("value")) && o.has("type") && o.has("value")
            && o.get("type").isJsonPrimitive()
            && (o.get("type").getAsString().equals("minecraft:constant") || o.get("type").getAsString().equals("constant"))) return true;
        return false;
    }

    static void keys(JsonElement e, Map<String, Integer> into) {
        if (e.isJsonObject()) {
            for (var en : e.getAsJsonObject().entrySet()) {
                if (!benign(e.getAsJsonObject(), en.getKey(), en.getValue())) into.merge(en.getKey(), 1, Integer::sum);
                keys(en.getValue(), into);
            }
        } else if (e.isJsonArray()) {
            for (JsonElement c : e.getAsJsonArray()) keys(c, into);
        }
    }

    static String ns(Path root, Path f) { return root.relativize(f).getName(0).toString(); }

    static String id(Path root, Path f, String kind) {
        Path rel = root.relativize(f);
        String path = rel.subpath(2, rel.getNameCount()).toString().replace(java.io.File.separatorChar, '/');
        return rel.getName(0) + ":" + path.substring(0, path.length() - ".json".length());
    }

    static List<Path> files(Path root, String kind) throws Exception {
        try (Stream<Path> s = Files.walk(root)) {
            return s.filter(p -> p.toString().endsWith(".json"))
                .filter(p -> { Path r = root.relativize(p); return r.getNameCount() > 2 && r.getName(1).toString().equals(kind); })
                .sorted().collect(Collectors.toList());
        }
    }

    static int bad = 0;

    /** Function types listed in -Dscan.skip=a,b are removed from modifier lists before parsing, for constructs a later phase converts. */
    static final Set<String> SKIP = new HashSet<>(Arrays.asList(System.getProperty("scan.skip", "").split(",")));

    /** Ids of the pack's instruments, parsed with the game's codec. Registry lookups cannot hold them, see inline(). */
    static final Set<String> INSTRUMENT_IDS = new HashSet<>();

    /** Ids of the pack's jukebox songs, parsed the same way. */
    static final Set<String> SONG_IDS = new HashSet<>();

    /** Replaces an instrument or jukebox_playable component naming a pack entry with a vanilla one, once the pack's file has parsed. */
    static JsonElement swapInstruments(JsonElement e) {
        if (e.isJsonObject()) {
            JsonObject o = new JsonObject();
            for (var en : e.getAsJsonObject().entrySet()) {
                JsonElement v = en.getValue();
                if (en.getKey().equals("minecraft:instrument") && v.isJsonPrimitive() && INSTRUMENT_IDS.contains(v.getAsString())) {
                    o.addProperty(en.getKey(), "minecraft:ponder_goat_horn");
                } else if (en.getKey().equals("minecraft:jukebox_playable") && v.isJsonPrimitive() && SONG_IDS.contains(v.getAsString())) {
                    o.addProperty(en.getKey(), "minecraft:cat");
                } else {
                    o.add(en.getKey(), swapInstruments(v));
                }
            }
            return o;
        }
        if (e.isJsonArray()) {
            JsonArray a = new JsonArray();
            for (JsonElement c : e.getAsJsonArray()) a.add(swapInstruments(c));
            return a;
        }
        return e;
    }

    static JsonElement strip(JsonElement e) {
        return stripSkipped(swapInstruments(e));
    }

    static JsonElement stripSkipped(JsonElement e) {
        if (SKIP.isEmpty() || (SKIP.size() == 1 && SKIP.contains(""))) return e;
        if (e.isJsonArray()) {
            JsonArray a = new JsonArray();
            for (JsonElement c : e.getAsJsonArray()) {
                if (c.isJsonObject() && c.getAsJsonObject().has("type") && c.getAsJsonObject().get("type").isJsonPrimitive()
                    && SKIP.contains(c.getAsJsonObject().get("type").getAsString())) continue;
                a.add(stripSkipped(c));
            }
            return a;
        }
        if (e.isJsonObject()) {
            JsonObject o = new JsonObject();
            for (var en : e.getAsJsonObject().entrySet()) o.add(en.getKey(), stripSkipped(en.getValue()));
            return o;
        }
        return e;
    }

    /**
     * The vanilla lookup already has a predicate registry, so the pack's predicates cannot be registered on top of it.
     * Replace a string that is exactly a pack predicate id with that predicate's JSON instead, except where a string is
     * a function or loot table id.
     */
    static final Set<String> TABLE_IDS = new HashSet<>();
    static final List<String> BAD_REFS = new ArrayList<>();
    static String currentFile = "";

    static JsonElement inline(JsonElement e, Map<String, JsonElement> preds, String parentKey) {
        if (e.isJsonPrimitive() && e.getAsJsonPrimitive().isString() && preds.containsKey(e.getAsString())
            && !"function".equals(parentKey) && !"name".equals(parentKey)) {
            return preds.get(e.getAsString());
        }
        if (e.isJsonObject()) {
            JsonObject src = e.getAsJsonObject();
            JsonObject o = new JsonObject();
            boolean tableRef = src.has("type") && src.get("type").isJsonPrimitive()
                && src.get("type").getAsString().equals("minecraft:loot_table") && src.has("value") && src.get("value").isJsonPrimitive();
            for (var en : src.entrySet()) {
                if (tableRef && en.getKey().equals("value")) {
                    String ref = en.getValue().getAsString();
                    if (ref.startsWith("foxcraft_dungeon_loot:") && !TABLE_IDS.contains(ref)) BAD_REFS.add(currentFile + " -> " + ref);
                    JsonObject stub = new JsonObject();
                    stub.add("pools", new JsonArray());
                    o.add("value", stub);
                } else {
                    o.add(en.getKey(), inline(en.getValue(), preds, en.getKey()));
                }
            }
            return o;
        }
        if (e.isJsonArray()) {
            JsonArray a = new JsonArray();
            for (JsonElement c : e.getAsJsonArray()) a.add(inline(c, preds, parentKey));
            return a;
        }
        return e;
    }

    static <T> void safe(Codec<T> codec, RegistryOps<JsonElement> ops, Path f, JsonElement json, String label) {
        try {
            roundTrip(codec, ops, f, json, label);
        } catch (RuntimeException ex) {
            bad++;
            out("CRASH " + label + " " + f.getFileName() + ": " + ex);
        }
    }

    static <T> T parse(Codec<T> codec, RegistryOps<JsonElement> ops, Path f, JsonElement json, String label) {
        DataResult<T> r = codec.parse(ops, json);
        if (r.error().isPresent()) {
            bad++;
            out("ERROR " + label + " " + f.getFileName() + ": " + r.error().get().message().replace('\n', ' '));
            return null;
        }
        return r.result().orElse(null);
    }

    static <T> void roundTrip(Codec<T> codec, RegistryOps<JsonElement> ops, Path f, JsonElement json, String label) {
        T parsed = parse(codec, ops, f, json, label);
        if (parsed == null) return;
        JsonElement back = codec.encodeStart(ops, parsed).getOrThrow();
        Map<String, Integer> a = new TreeMap<>(), b = new TreeMap<>();
        keys(json, a);
        keys(back, b);
        List<String> lost = new ArrayList<>();
        for (var e : a.entrySet()) {
            int kept = b.getOrDefault(e.getKey(), 0);
            if (kept < e.getValue()) lost.add(e.getKey() + " x" + (e.getValue() - kept));
        }
        if (!lost.isEmpty()) {
            bad++;
            out("DROPPED " + label + " " + f + ": " + String.join(", ", lost));
        }
    }

    public static void main(String[] args) throws Exception {
        boot();
        Path root = Paths.get(args[0]);
        RegistryOps<JsonElement> base = lookup.createSerializationContext(JsonOps.INSTANCE);

        // Pack instruments are data-driven; check their files here so the ids used by components can be trusted.
        for (Path f : files(root, "instrument")) {
            JsonElement j = JsonParser.parseString(Files.readString(f));
            roundTrip(Instrument.DIRECT_CODEC, base, f, j, "instrument");
            INSTRUMENT_IDS.add(id(root, f, "instrument"));
        }
        for (Path f : files(root, "jukebox_song")) {
            JsonElement j = JsonParser.parseString(Files.readString(f));
            roundTrip(JukeboxSong.DIRECT_CODEC, base, f, j, "jukebox_song");
            SONG_IDS.add(id(root, f, "jukebox_song"));
        }

        // Pass 1: predicates and item modifiers, so loot tables and advancements can reference them by id.
        RegistrySetBuilder rsb = new RegistrySetBuilder();
        Map<ResourceKey<LootItemCondition>, LootItemCondition> preds = new LinkedHashMap<>();
        Map<ResourceKey<LootItemFunction>, LootItemFunction> mods = new LinkedHashMap<>();
        List<Path> predFiles = files(root, "predicate"), modFiles = files(root, "item_modifier");
        for (Path f : predFiles) {
            JsonElement j = JsonParser.parseString(Files.readString(f));
            roundTrip(LootItemCondition.DIRECT_CODEC, base, f, j, "predicate");
            LootItemCondition c = LootItemCondition.DIRECT_CODEC.parse(base, j).result().orElse(null);
            if (c != null) preds.put(ResourceKey.create(Registries.PREDICATE, Identifier.parse(id(root, f, "predicate"))), c);
        }
        for (Path f : modFiles) {
            JsonElement j = strip(JsonParser.parseString(Files.readString(f)));
            // The registry loads a modifier file with TYPED_CODEC, which takes one object and rejects a bare list
            roundTrip(LootItemFunctions.TYPED_CODEC, base, f, j, "item_modifier");
            LootItemFunction c = LootItemFunctions.TYPED_CODEC.parse(base, j).result().orElse(null);
            if (c != null) mods.put(ResourceKey.create(Registries.ITEM_MODIFIER, Identifier.parse(id(root, f, "item_modifier"))), c);
        }
        rsb.add(Registries.ITEM_MODIFIER, ctx -> mods.forEach(ctx::register));
        RegistryOps<JsonElement> ops = rsb.build(lookup).createSerializationContext(JsonOps.INSTANCE);

        // Pass 2: everything that may reference them.
        Map<String, JsonElement> predJson = new HashMap<>();
        for (Path f : predFiles) predJson.put(id(root, f, "predicate"), JsonParser.parseString(Files.readString(f)));
        for (Path f : files(root, "loot_table")) TABLE_IDS.add(id(root, f, "loot_table"));
        for (Path f : files(root, "loot_table")) {
            currentFile = f.getFileName().toString();
            safe(LootTable.DIRECT_CODEC, ops, f, inline(strip(JsonParser.parseString(Files.readString(f))), predJson, null), "loot_table");
        }
        for (String r : BAD_REFS) { bad++; out("MISSING loot table reference " + r); }
        for (Path f : files(root, "advancement")) {
            JsonObject adv = JsonParser.parseString(Files.readString(f)).getAsJsonObject();
            // Reward loot tables resolve through the registry, which does not contain the pack's tables; check existence instead.
            if (adv.has("rewards") && adv.getAsJsonObject("rewards").has("loot")) {
                for (JsonElement r : adv.getAsJsonObject("rewards").getAsJsonArray("loot")) {
                    String ref = r.getAsString();
                    if (ref.startsWith("foxcraft_dungeon_loot:") && !TABLE_IDS.contains(ref)) {
                        bad++;
                        out("MISSING loot table reference " + f.getFileName() + " -> " + ref);
                    }
                }
                adv.getAsJsonObject("rewards").remove("loot");
            }
            safe(Advancement.CODEC, ops, f, inline(strip(adv), predJson, null), "advancement");
        }

        out("files: " + files(root, "loot_table").size() + " loot_table, " + predFiles.size() + " predicate, " + modFiles.size()
            + " item_modifier, " + files(root, "advancement").size() + " advancement; problems: " + bad);
        System.exit(bad == 0 ? 0 : 1);
    }
}
