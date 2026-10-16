import com.google.gson.*;
import com.mojang.serialization.*;
import net.minecraft.SharedConstants;
import net.minecraft.core.*;
import net.minecraft.core.component.DataComponents;
import net.minecraft.core.registries.*;
import net.minecraft.data.registries.VanillaRegistries;
import net.minecraft.resources.*;
import net.minecraft.server.Bootstrap;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.trading.ItemCost;
import net.minecraft.world.level.storage.loot.LootPool;
import net.minecraft.world.level.storage.loot.functions.LootItemFunction;
import net.minecraft.world.level.storage.loot.functions.LootItemFunctions;

/** Minimal harness that runs Minecraft's own parsers on test JSON. See tests/verifying-against-vanilla.md. */
public class Harness {
    static HolderLookup.Provider lookup;
    static RegistryOps<JsonElement> ops;

    /** Boot the game registries and bind every item's default components (as the data generator does). */
    static void boot() {
        SharedConstants.tryDetectVersion();
        Bootstrap.bootStrap();
        lookup = VanillaRegistries.createReloadableLookup(VanillaRegistries.createWorldLookup());
        BuiltInRegistries.DATA_COMPONENT_INITIALIZERS.build(lookup).forEach(pc -> pc.apply());
        ops = lookup.createSerializationContext(JsonOps.INSTANCE);
    }

    static JsonElement json(String s) { return JsonParser.parseString(s); }

    static ItemStack stack(String s) { return ItemStack.CODEC.parse(ops, json(s)).getOrThrow(); }

    /** Add item modifiers to the lookup so loot JSON can reference them by id. */
    static RegistryOps<JsonElement> opsWithModifier(String id, String inlineModifierJson) {
        LootItemFunction fn = LootItemFunctions.DIRECT_CODEC.parse(ops, json(inlineModifierJson)).getOrThrow();
        ResourceKey<LootItemFunction> key = ResourceKey.create(Registries.ITEM_MODIFIER, Identifier.parse(id));
        HolderLookup.Provider with = new RegistrySetBuilder()
            .add(Registries.ITEM_MODIFIER, ctx -> ctx.register(key, fn)).build(lookup);
        return with.createSerializationContext(JsonOps.INSTANCE);
    }

    static int failures = 0;

    /**
     * The game replaces System.out with a logger that prefixes every line, so print through the saved
     * original stream to keep the output easy to read and to grep.
     */
    static void check(String label, boolean ok) {
        if (!ok) failures++;
        Bootstrap.STDOUT.println((ok ? "PASS " : "FAIL ") + label);
    }

    public static void main(String[] args) {
        boot();

        // 1. Default components are not removed by setting others (only "!" removes).
        ItemStack kept = stack("{\"id\":\"minecraft:poisonous_potato\",\"count\":1,\"components\":{\"minecraft:item_model\":\"ns:x\",\"minecraft:max_stack_size\":99}}");
        check("setting components keeps unrelated defaults (consumable, food)", kept.has(DataComponents.CONSUMABLE) && kept.has(DataComponents.FOOD));
        ItemStack stripped = stack("{\"id\":\"minecraft:poisonous_potato\",\"count\":1,\"components\":{\"!minecraft:consumable\":{},\"!minecraft:food\":{}}}");
        check("! removes a default", !stripped.has(DataComponents.CONSUMABLE) && !stripped.has(DataComponents.FOOD));

        // 2. Trade cost matching: only listed components are compared, extras on the stack are ignored.
        ItemStack coin = stack("{\"id\":\"minecraft:gold_nugget\",\"count\":5,\"components\":{\"minecraft:item_model\":\"ns:coin/silver\",\"minecraft:custom_name\":{\"text\":\"Renamed\"}}}");
        ItemCost cost = ItemCost.CODEC.parse(ops, json("{\"id\":\"minecraft:gold_nugget\",\"count\":3,\"components\":{\"minecraft:item_model\":\"ns:coin/silver\"}}")).getOrThrow();
        check("cost on item_model matches a renamed coin", cost.test(coin));

        // 3. Loot JSON using pre-26.3 keys parses but is silently stripped.
        String old = "{\"rolls\":1,\"entries\":[{\"type\":\"minecraft:item\",\"name\":\"minecraft:stick\",\"functions\":[{\"function\":\"minecraft:set_count\",\"count\":2}]}]}";
        JsonElement kept26 = LootPool.CODEC.encodeStart(ops, LootPool.CODEC.parse(ops, json(old)).getOrThrow()).getOrThrow();
        check("old-key loot entry lost its functions", !kept26.toString().contains("set_count"));

        // 4. Loot tables accept an item modifier id once the modifier exists.
        var withMod = opsWithModifier("ns:items/example", "{\"type\":\"minecraft:set_components\",\"components\":{\"minecraft:rarity\":\"rare\"}}");
        String pool = "{\"rolls\":1,\"entries\":[{\"type\":\"minecraft:item\",\"name\":\"minecraft:stick\",\"modifier\":\"ns:items/example\"}]}";
        check("loot entry accepts an item modifier id", LootPool.CODEC.parse(withMod, json(pool)).result().isPresent());

        System.exit(failures == 0 ? 0 : 1);
    }
}
