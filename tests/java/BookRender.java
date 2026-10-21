import com.google.gson.*;
import com.mojang.serialization.JsonOps;
import net.minecraft.SharedConstants;
import net.minecraft.client.StringSplitter;
import net.minecraft.core.HolderLookup;
import net.minecraft.data.registries.VanillaRegistries;
import net.minecraft.locale.Language;
import net.minecraft.network.chat.*;
import net.minecraft.server.Bootstrap;
import net.minecraft.util.FormattedCharSequence;
import net.minecraft.util.StringDecomposer;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.nio.file.*;
import java.util.*;
import java.util.List;
import java.util.stream.*;

/**
 * Renders every generated written book to PNG files, one per page, as the book screen shows it. The pages are read with the
 * game's component codec, translated from the resource pack lang files and broken into lines by the game's own StringSplitter,
 * so the line breaks are the game's. Drawing is done here, without a GPU: the glyphs of the pack and vanilla bitmap fonts are
 * placed as the screen places them, on the vanilla book background. A page the game breaks into more than 14 lines, so that
 * its end is cut off in game, fails the run. A book with filtered pages is drawn again as a reader with chat filtering sees it,
 * into <locale>/<book>/filtered. Every locale is drawn into a folder of its own, with the books that have a source in src/books/<locale>.
 * Usage: BookRender ROOT OUT_DIR [SCALE]   (the repo root, where to write <locale>/<book>/page_NN.png, pixels per GUI pixel, default 3)
 */
public class BookRender {
    // The book screen, BookViewScreen: the text box and where its text and page counter go on the 192x192 background
    static final int TEXT_X = 36, TEXT_Y = 30, TEXT_WIDTH = 114, LINE_HEIGHT = 9, MAX_LINES = 128 / LINE_HEIGHT;
    static final int INDICATOR_RIGHT = 148, INDICATOR_Y = 16, BOOK_SIZE = 192;
    static final int TEXT_COLOR = 0x000000;

    static Path root;
    static int scale;
    static final Map<String, FontSet> fonts = new HashMap<>();
    static final Set<String> warned = new TreeSet<>();

    static void out(String s) { Bootstrap.STDOUT.println(s); }

    /** A glyph: how far it advances, and the cell it draws with its size and height above the baseline, if it draws at all. */
    record Glyph(float advance, BufferedImage image, float scale, int ascent) {}

    /** The providers of a font in order, the first one with a glyph for a code point wins, as in the game. */
    static class FontSet {
        final List<Map<Integer, Glyph>> providers = new ArrayList<>();
        final Map<Integer, Glyph> cache = new HashMap<>();
        boolean found = true;

        Glyph glyph(int cp) {
            return cache.computeIfAbsent(cp, c -> {
                for (var p : providers) if (p.containsKey(c)) return p.get(c);
                return null;
            });
        }
    }

    // The glyph the game draws for a code point no provider has: a 5x8 box, 6 wide
    static final Glyph MISSING;
    static {
        BufferedImage box = new BufferedImage(5, 8, BufferedImage.TYPE_INT_ARGB);
        for (int x = 0; x < 5; x++) for (int y = 0; y < 8; y++) if (x == 0 || y == 0 || x == 4 || y == 7) box.setRGB(x, y, 0xffffffff);
        MISSING = new Glyph(6, box, 1, 7);
    }

    /** A resource of the resource pack, else of the client jar on the classpath, as in game with the pack on top. */
    static InputStream resource(String ns, String path) throws Exception {
        Path f = root.resolve("texturepack/assets").resolve(ns).resolve(path);
        if (Files.exists(f)) return Files.newInputStream(f);
        return BookRender.class.getResourceAsStream("/assets/" + ns + "/" + path);
    }

    static String[] id(String id) {
        int colon = id.indexOf(':');
        return colon < 0 ? new String[] {"minecraft", id} : new String[] {id.substring(0, colon), id.substring(colon + 1)};
    }

    static FontSet font(String fontId) {
        FontSet cached = fonts.get(fontId);
        if (cached != null) return cached;
        FontSet set = new FontSet();
        fonts.put(fontId, set);
        try {
            if (!addProviders(set, fontId)) {
                set.found = false;
                warned.add("font " + fontId + " is not defined, its text draws as missing glyphs");
            }
        } catch (Exception e) {
            throw new RuntimeException("font " + fontId + ": " + e, e);
        }
        return set;
    }

    static boolean addProviders(FontSet set, String fontId) throws Exception {
        String[] rl = id(fontId);
        InputStream in = resource(rl[0], "font/" + rl[1] + ".json");
        if (in == null) return false;
        JsonObject json;
        try (in) { json = JsonParser.parseString(new String(in.readAllBytes(), "UTF-8")).getAsJsonObject(); }
        for (JsonElement el : json.getAsJsonArray("providers")) {
            JsonObject p = el.getAsJsonObject();
            // A filtered provider is used only when its options match the defaults, which are all off
            if (p.has("filter") && p.getAsJsonObject("filter").entrySet().stream().anyMatch(e -> e.getValue().getAsBoolean())) continue;
            String type = p.get("type").getAsString().replace("minecraft:", "");
            switch (type) {
                case "reference" -> {
                    if (!addProviders(set, p.get("id").getAsString())) warned.add("font " + fontId + " references " + p.get("id").getAsString() + ", which is not defined");
                }
                case "space" -> {
                    Map<Integer, Glyph> glyphs = new HashMap<>();
                    for (var e : p.getAsJsonObject("advances").entrySet()) glyphs.put(e.getKey().codePointAt(0), new Glyph(e.getValue().getAsFloat(), null, 1, 0));
                    set.providers.add(glyphs);
                }
                case "bitmap" -> set.providers.add(bitmap(p));
                default -> warned.add("font " + fontId + " has a " + type + " provider, which is not drawn");
            }
        }
        return true;
    }

    /** A bitmap provider: the cells of the sheet by the rows of chars, each advancing its ink scaled plus one, as BitmapProvider does. */
    static Map<Integer, Glyph> bitmap(JsonObject p) throws Exception {
        String[] file = id(p.get("file").getAsString());
        BufferedImage sheet;
        try (InputStream in = resource(file[0], "textures/" + file[1])) {
            if (in == null) throw new IllegalStateException("no texture " + p.get("file").getAsString());
            sheet = ImageIO.read(in);
        }
        List<int[]> rows = new ArrayList<>();
        for (JsonElement r : p.getAsJsonArray("chars")) rows.add(r.getAsString().codePoints().toArray());
        int columns = rows.get(0).length;
        int cellW = sheet.getWidth() / columns, cellH = sheet.getHeight() / rows.size();
        int height = p.has("height") ? p.get("height").getAsInt() : 8;
        int ascent = p.get("ascent").getAsInt();
        float glyphScale = (float) height / cellH;
        Map<Integer, Glyph> glyphs = new HashMap<>();
        for (int row = 0; row < rows.size(); row++) {
            for (int col = 0; col < rows.get(row).length; col++) {
                int cp = rows.get(row)[col];
                if (cp == 0 || glyphs.containsKey(cp)) continue;
                BufferedImage cell = sheet.getSubimage(col * cellW, row * cellH, cellW, cellH);
                int ink = 0;
                for (int x = cellW - 1; x >= 0 && ink == 0; x--) for (int y = 0; y < cellH; y++) if ((cell.getRGB(x, y) >>> 24) != 0) { ink = x + 1; break; }
                glyphs.put(cp, new Glyph((int) (0.5 + ink * glyphScale) + 1, cell, glyphScale, ascent));
            }
        }
        return glyphs;
    }

    static String fontOf(Style style) {
        return style.getFont() instanceof FontDescription.Resource r ? r.id().toString() : "minecraft:default";
    }

    static Glyph glyph(int cp, Style style) {
        FontSet set = font(fontOf(style));
        Glyph g = set.glyph(cp);
        return g == null ? MISSING : g;
    }

    /** The advance of a glyph in its style, a bold one a pixel further, as Font.width measures it for the splitter. */
    static float advance(int cp, Style style) {
        return glyph(cp, style).advance() + (style.isBold() ? 1 : 0);
    }

    /** The lang files of the resource pack, every namespace, for a locale. */
    static List<Path> langFiles(String locale) throws Exception {
        try (Stream<Path> files = Files.walk(root.resolve("texturepack/assets"))) {
            return files.filter(f -> f.getParent().getFileName().toString().equals("lang") && f.getFileName().toString().equals(locale + ".json")).sorted().toList();
        }
    }

    /** The locales the resource pack has lang files for, en_us first. */
    static List<String> locales() throws Exception {
        try (Stream<Path> files = Files.walk(root.resolve("texturepack/assets"))) {
            return files.filter(f -> f.getParent().getFileName().toString().equals("lang") && f.toString().endsWith(".json"))
                .map(f -> f.getFileName().toString().replaceFirst("\\.json$", "")).distinct()
                .sorted(Comparator.comparing((String l) -> !l.equals("en_us")).thenComparing(l -> l)).toList();
        }
    }

    /**
     * The lang entries a locale has in game: en_us under it, as the game loads it, then the locale. The client jar holds only the
     * vanilla en_us, the other vanilla locales come from the asset index, so vanilla text such as the page counter stays English.
     */
    static Language language(String locale) throws Exception {
        Map<String, String> entries = new HashMap<>();
        try (InputStream in = BookRender.class.getResourceAsStream("/assets/minecraft/lang/en_us.json")) {
            if (in != null) Language.loadFromJson(in, entries::put);
        }
        List<Path> files = new ArrayList<>(langFiles("en_us"));
        if (!locale.equals("en_us")) files.addAll(langFiles(locale));
        for (Path f : files) {
            try (InputStream in = Files.newInputStream(f)) { Language.loadFromJson(in, entries::put); }
        }
        return new Language() {
            public String getOrDefault(String key, String fallback) { return entries.getOrDefault(key, fallback); }
            public boolean has(String key) { return entries.containsKey(key); }
            public boolean isDefaultRightToLeft() { return false; }
            public FormattedCharSequence getVisualOrder(FormattedText text) {
                return sink -> text.visit((style, s) -> StringDecomposer.iterateFormatted(s, style, sink) ? Optional.empty() : FormattedText.STOP_ITERATION, Style.EMPTY).isEmpty();
            }
        };
    }

    /** Draws one glyph at a GUI position, tinted, sheared when italic, as the game's text renderer places it. */
    static void draw(Graphics2D g, Glyph glyph, float x, float y, int rgb, boolean italic) {
        if (glyph.image() == null) return;
        BufferedImage cell = glyph.image();
        BufferedImage tinted = new BufferedImage(cell.getWidth(), cell.getHeight(), BufferedImage.TYPE_INT_ARGB);
        for (int px = 0; px < cell.getWidth(); px++) {
            for (int py = 0; py < cell.getHeight(); py++) {
                int c = cell.getRGB(px, py);
                int r = ((c >> 16) & 0xff) * ((rgb >> 16) & 0xff) / 255, gr = ((c >> 8) & 0xff) * ((rgb >> 8) & 0xff) / 255, b = (c & 0xff) * (rgb & 0xff) / 255;
                tinted.setRGB(px, py, (c & 0xff000000) | (r << 16) | (gr << 8) | b);
            }
        }
        float up = 7 - glyph.ascent();
        float height = cell.getHeight() * glyph.scale();
        AffineTransform at = new AffineTransform();
        at.scale(scale, scale);
        // Italic leans the top one pixel right and the rest by a quarter pixel for each pixel down
        float topShift = italic ? 1 - 0.25f * up : 0, bottomShift = italic ? 1 - 0.25f * (up + height) : 0;
        at.translate(x + topShift, y + up);
        at.shear((bottomShift - topShift) / height, 0);
        at.scale(glyph.scale(), glyph.scale());
        g.drawImage(tinted, at, null);
    }

    /** Draws a line of formatted text from x, returning where it ends. */
    static float drawLine(Graphics2D g, FormattedText line, float x, float y) {
        float[] pen = {x};
        line.visit((style, s) -> {
            StringDecomposer.iterateFormatted(s, style, (index, st, cp) -> {
                Glyph glyph = glyph(cp, st);
                int rgb = st.getColor() != null ? st.getColor().getValue() : TEXT_COLOR;
                draw(g, glyph, pen[0], y, rgb, st.isItalic());
                if (st.isBold()) draw(g, glyph, pen[0] + 1, y, rgb, st.isItalic());
                float adv = glyph.advance() + (st.isBold() ? 1 : 0);
                g.setColor(new Color(rgb));
                if (st.isStrikethrough()) g.fill(new java.awt.geom.Rectangle2D.Float((pen[0] - 1) * scale, (y + 3.5f) * scale, (adv + 1) * scale, scale));
                if (st.isUnderlined()) g.fill(new java.awt.geom.Rectangle2D.Float((pen[0] - 1) * scale, (y + LINE_HEIGHT - 1) * scale, (adv + 1) * scale, scale));
                pen[0] += adv;
                return true;
            });
            return Optional.empty();
        }, Style.EMPTY);
        return pen[0];
    }

    /** The pages of a book modifier, from its written_book_content, each as its raw side and its filtered side, null when it has none. */
    static List<JsonElement[]> pagesOf(JsonElement el) {
        if (el.isJsonObject()) {
            JsonObject o = el.getAsJsonObject();
            if (o.has("minecraft:written_book_content")) {
                List<JsonElement[]> pages = new ArrayList<>();
                for (JsonElement p : o.getAsJsonObject("minecraft:written_book_content").getAsJsonArray("pages")) {
                    boolean filterable = p.isJsonObject() && p.getAsJsonObject().has("raw");
                    pages.add(filterable ? new JsonElement[] {p.getAsJsonObject().get("raw"), p.getAsJsonObject().get("filtered")} : new JsonElement[] {p, null});
                }
                return pages;
            }
            for (var e : o.entrySet()) {
                List<JsonElement[]> found = pagesOf(e.getValue());
                if (found != null) return found;
            }
        } else if (el.isJsonArray()) {
            for (JsonElement e : el.getAsJsonArray()) {
                List<JsonElement[]> found = pagesOf(e);
                if (found != null) return found;
            }
        }
        return null;
    }

    public static void main(String[] args) throws Exception {
        root = Path.of(args[0]).toAbsolutePath();
        Path outDir = Path.of(args[1]).toAbsolutePath();
        scale = args.length > 2 ? Integer.parseInt(args[2]) : 3;
        SharedConstants.tryDetectVersion();
        Bootstrap.bootStrap();
        HolderLookup.Provider lookup = VanillaRegistries.createReloadableLookup(VanillaRegistries.createWorldLookup());
        var ops = lookup.createSerializationContext(JsonOps.INSTANCE);
        StringSplitter splitter = new StringSplitter(BookRender::advance);
        // The style the book screen merges into every page
        var pageStyleField = Class.forName("net.minecraft.client.gui.screens.inventory.BookViewScreen").getDeclaredField("PAGE_TEXT_STYLE");
        pageStyleField.setAccessible(true);
        Style pageStyle = (Style) pageStyleField.get(null);

        BufferedImage background;
        try (InputStream in = BookRender.class.getResourceAsStream("/assets/minecraft/textures/gui/book.png")) {
            background = ImageIO.read(in).getSubimage(0, 0, BOOK_SIZE, BOOK_SIZE);
        }

        Path modifiers = root.resolve("data/foxcraft_dungeon_loot/item_modifier/random_loot/book/generated");
        if (!Files.isDirectory(modifiers)) {
            out("no generated books in " + modifiers);
            System.exit(1);
        }
        if (Files.isDirectory(outDir)) try (Stream<Path> old = Files.walk(outDir)) {
            for (Path f : old.sorted(Comparator.reverseOrder()).toList()) Files.delete(f);
        }
        int books = 0, pagesDrawn = 0;
        List<String> failures = new ArrayList<>();
        List<Path> files;
        try (Stream<Path> s = Files.list(modifiers)) { files = s.filter(f -> f.toString().endsWith(".json")).sorted().toList(); }
        List<String> locales = locales();
        for (String locale : locales) {
            Language.inject(language(locale));
            for (Path file : files) {
                String book = file.getFileName().toString().replaceFirst("\\.json$", "");
                List<JsonElement[]> pages = pagesOf(JsonParser.parseString(Files.readString(file)));
                if (pages == null) continue;
                // A book is in a locale only where it has a source there, the rest would just repeat the English
                if (!locale.equals("en_us") && !Files.exists(root.resolve("src/books").resolve(locale).resolve(book + ".md"))) continue;
                if (locale.equals("en_us")) books++;
                // With chat filtering on the book shows the filtered side of each page that has one, the raw side of the rest
                boolean filtered = pages.stream().anyMatch(p -> p[1] != null);
                for (String side : filtered ? List.of("raw", "filtered") : List.of("raw")) {
                    Path dir = outDir.resolve(locale).resolve(book);
                    if (side.equals("filtered")) dir = dir.resolve("filtered");
                    Files.createDirectories(dir);
                    for (int n = 0; n < pages.size(); n++) {
                        JsonElement json = side.equals("filtered") && pages.get(n)[1] != null ? pages.get(n)[1] : pages.get(n)[0];
                        // Parsed again for every locale, so the translations are resolved in the language just injected
                        Component page = ComponentSerialization.CODEC.parse(ops, json).getOrThrow(e -> new IllegalStateException(book + ": " + e));
                        List<FormattedText> lines = splitter.splitLines(ComponentUtils.mergeStyles(page, pageStyle), TEXT_WIDTH, Style.EMPTY);
                        String where = locale + " " + book + (side.equals("filtered") ? " filtered" : "") + " page " + (n + 1);
                        if (lines.size() > MAX_LINES) failures.add(where + " is " + lines.size() + " lines in game, the book shows " + MAX_LINES);

                        BufferedImage image = new BufferedImage(BOOK_SIZE * scale, BOOK_SIZE * scale, BufferedImage.TYPE_INT_ARGB);
                        Graphics2D g = image.createGraphics();
                        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
                        g.drawImage(background, 0, 0, BOOK_SIZE * scale, BOOK_SIZE * scale, null);
                        Component indicator = Component.translatable("book.pageIndicator", n + 1, pages.size());
                        drawLine(g, indicator, INDICATOR_RIGHT - splitter.stringWidth(indicator), INDICATOR_Y);
                        for (int i = 0; i < Math.min(lines.size(), MAX_LINES); i++) drawLine(g, lines.get(i), TEXT_X, TEXT_Y + i * LINE_HEIGHT);
                        g.dispose();
                        ImageIO.write(image, "png", dir.resolve(String.format("page_%02d.png", n + 1)).toFile());
                        pagesDrawn++;
                    }
                }
            }
        }
        warned.forEach(w -> out("WARN " + w));
        failures.forEach(f -> out("FAIL " + f));
        out(books + " books in " + locales.size() + " locales, " + pagesDrawn + " pages drawn to " + outDir);
        System.exit(failures.isEmpty() ? 0 : 1);
    }
}
