import com.google.gson.*;
import com.mojang.serialization.JsonOps;
import net.minecraft.ChatFormatting;
import net.minecraft.SharedConstants;
import net.minecraft.client.StringSplitter;
import net.minecraft.client.resources.language.FormattedBidiReorder;
import net.minecraft.core.HolderLookup;
import net.minecraft.data.registries.VanillaRegistries;
import net.minecraft.locale.Language;
import net.minecraft.network.chat.*;
import net.minecraft.resources.RegistryOps;
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
 * into <locale>/[<group>/]<book>/filtered. Every locale is drawn into a folder of its own, with the books that have a source in src/books/<locale>.
 * Usage: BookRender ROOT OUT_DIR [SCALE]   (the repo root, where to write <locale>/<book>/page_NN.png, pixels per GUI pixel, default 3)
 */
public class BookRender {
    // The book screen, BookViewScreen: the text box and where its text and page counter go on the 192x192 background
    static final int TEXT_X = 36, TEXT_Y = 30, TEXT_WIDTH = 114, LINE_HEIGHT = 9, MAX_LINES = 128 / LINE_HEIGHT;
    static final int INDICATOR_RIGHT = 148, INDICATOR_Y = 16, BOOK_SIZE = 192;
    static final int TEXT_COLOR = 0x000000;

    static Path root;
    // What drawLine uses for text with no color of its own, and whether it shades text the way tooltips do
    static int textColor = TEXT_COLOR;
    static boolean autoShadow = false;
    // Obfuscated text: frames of a page that has some, shown 5 per second, and the random source that picks each stand-in glyph
    static final int ANIM_FRAMES = 15, ANIM_FPS = 5;
    static boolean sawObfuscated = false;
    static Random obfuscationRandom = new Random(0);
    static long lineSeed;
    // Where the page being drawn has text that opens a link, as {x, y, width, height, url} in GUI pixels; null when not collecting
    static List<Object[]> linkSink = null;
    // Glyphs of the line being drawn that are not blank, and how many of those are not underlined or sit under an event; a line of only underlined text is a heading
    static int inkGlyphs = 0, plainGlyphs = 0;

    /** A book source is src/books/<locale>/<id>.md, or one folder down in a group such as an author: book is <group>/<id> then. */
    static boolean hasSource(Path localeDir, String book) {
        return Files.exists(localeDir.resolve(book + ".md"));
    }
    static int scale;
    static final Map<String, FontSet> fonts = new HashMap<>();
    static String at = "";
    static final Set<String> warned = new TreeSet<>();

    static void out(String s) { Bootstrap.STDOUT.println(s); }

    /** A glyph: how far it advances, and the cell it draws with its size and height above the baseline, if it draws at all. */
    record Glyph(float advance, BufferedImage image, float scale, int ascent) {}

    /** The providers of a font in order, the first one with a glyph for a code point wins, as in the game. */
    static class FontSet {
        final List<Map<Integer, Glyph>> providers = new ArrayList<>();
        final Map<Integer, Glyph> cache = new HashMap<>();
        boolean found = true;

        /** Every glyph that draws, by advance rounded to whole pixels, what obfuscated text picks its stand-ins from. */
        Map<Integer, List<Glyph>> byWidth;

        Glyph randomOfWidth(Glyph like, Random rnd) {
            if (byWidth == null) {
                byWidth = new HashMap<>();
                for (var p : providers) for (Glyph g : p.values()) {
                    if (g.image() != null) byWidth.computeIfAbsent(Math.round(g.advance()), w -> new ArrayList<>()).add(g);
                }
            }
            List<Glyph> same = byWidth.get(Math.round(like.advance()));
            return same == null || same.isEmpty() ? like : same.get(rnd.nextInt(same.size()));
        }

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

    /**
     * The Unifont files the game takes from its asset index, not from the client jar, whose own include/unifont.json is
     * empty: tests/tools/fetch_mc_jar.mjs puts them in tests/.cache/mc/<version>/unifont.
     */
    static Path unifontDir() throws Exception {
        Path mc = root.resolve("tests/.cache/mc");
        if (!Files.isDirectory(mc)) return null;
        try (Stream<Path> versions = Files.list(mc)) {
            return versions.map(v -> v.resolve("unifont")).filter(Files::isDirectory).sorted().reduce((a, b) -> b).orElse(null);
        }
    }

    /** A resource of the resource pack, else Unifont, else of the client jar on the classpath, as in game with the pack on top. */
    static InputStream resource(String ns, String path) throws Exception {
        Path f = root.resolve("texturepack/assets").resolve(ns).resolve(path);
        if (Files.exists(f)) return Files.newInputStream(f);
        if (ns.equals("minecraft") && path.matches("font/(include/)?unifont[a-z_]*\\.(json|zip)")) {
            Path dir = unifontDir();
            Path file = dir == null ? null : dir.resolve(path.substring(path.lastIndexOf('/') + 1));
            if (file != null && Files.exists(file)) return Files.newInputStream(file);
        }
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
                case "unihex" -> {
                    Map<Integer, Glyph> glyphs = unihex(p);
                    if (glyphs == null) warned.add("font " + fontId + " needs " + p.get("hex_file").getAsString() + ", run node tests/tools/fetch_mc_jar.mjs; its glyphs draw as missing");
                    else set.providers.add(glyphs);
                }
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

    /** The glyphs of a Unifont hex file, drawn when first asked for: 114000 images would be a lot to keep. */
    static class LazyGlyphs extends HashMap<Integer, Glyph> {
        final Map<Integer, String> hex = new HashMap<>();
        final List<int[]> overrides = new ArrayList<>();

        @Override public boolean containsKey(Object cp) { return hex.containsKey(cp); }

        @Override public Glyph get(Object key) {
            Glyph done = super.get(key);
            if (done != null || !hex.containsKey(key)) return done;
            int cp = (Integer) key;
            String data = hex.get(cp);
            int bits = data.length() / 16 * 4; // 16 rows of this many columns
            long[] rows = new long[16];
            int first = bits, last = -1;
            for (int y = 0; y < 16; y++) {
                rows[y] = Long.parseLong(data.substring(y * bits / 4, (y + 1) * bits / 4), 16);
                for (int x = 0; x < bits; x++) {
                    if ((rows[y] >> (bits - 1 - x) & 1) != 0) { first = Math.min(first, x); last = Math.max(last, x); }
                }
            }
            // UnihexProvider.LineData.calculateWidth: the inked columns, or none at all and the width of the line
            int left = last < 0 ? 0 : first, right = last < 0 ? bits : last;
            for (int[] o : overrides) if (cp >= o[0] && cp <= o[1]) { left = o[2]; right = o[3]; }
            int width = right - left + 1;
            BufferedImage image = new BufferedImage(Math.max(width, 1), 16, BufferedImage.TYPE_INT_ARGB);
            for (int y = 0; y < 16; y++) {
                for (int x = left; x <= right && x < bits; x++) if ((rows[y] >> (bits - 1 - x) & 1) != 0) image.setRGB(x - left, y, 0xffffffff);
            }
            // The glyph advances width / 2 + 1 and is drawn half size, as Glyph.info and bake do
            Glyph g = new Glyph(width / 2 + 1, image, 0.5f, 7);
            put(cp, g);
            return g;
        }
    }

    /** A unihex provider, or null when its zip is not in the cache. */
    static Map<Integer, Glyph> unihex(JsonObject p) throws Exception {
        String[] file = id(p.get("hex_file").getAsString());
        LazyGlyphs glyphs = new LazyGlyphs();
        if (p.has("size_overrides")) {
            for (JsonElement el : p.getAsJsonArray("size_overrides")) {
                JsonObject o = el.getAsJsonObject();
                glyphs.overrides.add(new int[] {o.get("from").getAsString().codePointAt(0), o.get("to").getAsString().codePointAt(0), o.get("left").getAsInt(), o.get("right").getAsInt()});
            }
        }
        try (InputStream in = resource(file[0], file[1])) {
            if (in == null) return null;
            try (var zip = new java.util.zip.ZipInputStream(in)) {
                for (var entry = zip.getNextEntry(); entry != null; entry = zip.getNextEntry()) {
                    if (!entry.getName().endsWith(".hex")) continue;
                    for (String line : new String(zip.readAllBytes(), "UTF-8").split("\\r?\\n")) {
                        int colon = line.indexOf(':');
                        if (colon > 0) glyphs.hex.put(Integer.parseInt(line.substring(0, colon), 16), line.substring(colon + 1).trim());
                    }
                }
            }
        }
        return glyphs;
    }

    static String fontOf(Style style) {
        return style.getFont() instanceof FontDescription.Resource r ? r.id().toString() : "minecraft:default";
    }

    /** Object components, a sprite or a head, are 8 pixels of the line. Their images are drawn as they are, not tinted by the text color. */
    static final Map<String, Glyph> OBJECTS = new HashMap<>();
    static final Set<BufferedImage> UNTINTED = Collections.newSetFromMap(new IdentityHashMap<>());

    static Glyph objectGlyph(String key, String texture) {
        return OBJECTS.computeIfAbsent(key, k -> {
            try (InputStream in = BookRender.class.getResourceAsStream(texture)) {
                BufferedImage image = in == null ? null : ImageIO.read(in);
                if (image == null) {
                    warned.add("object texture " + texture + " is not in the client jar, it draws as a missing glyph, in " + at);
                    return MISSING;
                }
                UNTINTED.add(image);
                return new Glyph(8, image, 8f / image.getWidth(), 7);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    /**
     * The skin URL a profile names in its textures property, a base64 JSON the way the game reads it. A profile with only a name
     * has none, the game would look it up with Mojang, which is not done here.
     */
    static String skinUrl(FontDescription.PlayerSprite p) {
        try {
            for (var prop : p.profile().partialProfile().properties().get("textures")) {
                JsonObject skin = JsonParser.parseString(new String(Base64.getDecoder().decode(prop.value()), java.nio.charset.StandardCharsets.UTF_8))
                    .getAsJsonObject().getAsJsonObject("textures").getAsJsonObject("SKIN");
                return skin.get("url").getAsString();
            }
        } catch (Exception e) { /* a profile without a readable skin */ }
        return null;
    }

    /** The skin at a URL, kept in tests/.cache/skins by its name so a rebuild does not fetch it again; null when it cannot be had. */
    static BufferedImage fetchSkin(String url) {
        try {
            Path file = root.resolve("tests/.cache/skins").resolve(url.substring(url.lastIndexOf('/') + 1) + ".png");
            if (!Files.exists(file)) {
                var request = java.net.http.HttpRequest.newBuilder(java.net.URI.create(url)).timeout(java.time.Duration.ofSeconds(20)).build();
                var response = java.net.http.HttpClient.newHttpClient().send(request, java.net.http.HttpResponse.BodyHandlers.ofByteArray());
                if (response.statusCode() != 200) return null;
                Files.createDirectories(file.getParent());
                Files.write(file, response.body());
            }
            return ImageIO.read(file.toFile());
        } catch (Exception e) {
            return null;
        }
    }

    /** The head of a player: the face of their skin with the hat layer over it, from the skin the profile names, else Steve's. */
    static Glyph headGlyph(FontDescription.PlayerSprite p) {
        String url = skinUrl(p);
        return OBJECTS.computeIfAbsent("head " + url + " " + p.hat(), k -> {
            BufferedImage skin = url == null ? null : fetchSkin(url);
            if (skin == null) {
                if (url != null) warned.add("skin " + url + " could not be fetched, the head is drawn as Steve, in " + at);
                try (InputStream in = BookRender.class.getResourceAsStream("/assets/minecraft/textures/entity/player/wide/steve.png")) {
                    skin = ImageIO.read(in);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
            BufferedImage face = new BufferedImage(8, 8, BufferedImage.TYPE_INT_ARGB);
            Graphics2D fg = face.createGraphics();
            fg.drawImage(skin.getSubimage(8, 8, 8, 8), 0, 0, null);
            if (p.hat()) fg.drawImage(skin.getSubimage(40, 8, 8, 8), 0, 0, null);
            fg.dispose();
            UNTINTED.add(face);
            return new Glyph(8, face, 1, 7);
        });
    }

    static Glyph glyph(int cp, Style style) {
        if (style.getFont() instanceof FontDescription.PlayerSprite p) return headGlyph(p);
        if (style.getFont() instanceof FontDescription.AtlasSprite a) return objectGlyph("sprite " + a.spriteId(), "/assets/" + a.spriteId().getNamespace() + "/textures/" + a.spriteId().getPath() + ".png");
        // Anything else below is a glyph of a font
        FontSet set = font(fontOf(style));
        Glyph g = set.glyph(cp);
        if (g == null) warned.add("U+" + Integer.toHexString(cp) + " is not in font " + fontOf(style) + ", it draws as a missing glyph, in " + at);
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
    /** The vanilla locales written right to left, whose lines the game shapes and reorders by the bidirectional algorithm. */
    static final Set<String> RTL_LOCALES = Set.of("ar_sa", "he_il");

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
            public boolean isDefaultRightToLeft() { return RTL_LOCALES.contains(locale); }
            public FormattedCharSequence getVisualOrder(FormattedText text) {
                return FormattedBidiReorder.reorder(text, isDefaultRightToLeft());
            }
        };
    }

    /** Draws one glyph at a GUI position, tinted with an ARGB color, sheared when italic, as the game's text renderer places it. */
    static void draw(Graphics2D g, Glyph glyph, float x, float y, int argb, boolean italic) {
        if (glyph.image() == null) return;
        BufferedImage cell = glyph.image();
        if (UNTINTED.contains(cell)) argb = 0xffffffff & (argb | 0x00ffffff);
        BufferedImage tinted = new BufferedImage(cell.getWidth(), cell.getHeight(), BufferedImage.TYPE_INT_ARGB);
        for (int px = 0; px < cell.getWidth(); px++) {
            for (int py = 0; py < cell.getHeight(); py++) {
                int c = cell.getRGB(px, py);
                int a = (c >>> 24) * (argb >>> 24) / 255, r = ((c >> 16) & 0xff) * ((argb >> 16) & 0xff) / 255, gr = ((c >> 8) & 0xff) * ((argb >> 8) & 0xff) / 255, b = (c & 0xff) * (argb & 0xff) / 255;
                tinted.setRGB(px, py, (a << 24) | (r << 16) | (gr << 8) | b);
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

    /**
     * Draws a line of formatted text from x, returning where it ends. The book screen draws no drop shadow, but a style's
     * shadow_color is drawn anyway, as the game does: the glyphs and lines again in that ARGB color one pixel right and down,
     * all under the text.
     */
    static float drawLine(Graphics2D g, FormattedText line, float x, float y) {
        // The shadow pass and the text pass pick the same stand-ins for obfuscated glyphs
        lineSeed = obfuscationRandom.nextLong();
        drawPass(g, line, x, y, true);
        return drawPass(g, line, x, y, false);
    }

    static float drawPass(Graphics2D g, FormattedText line, float x, float y, boolean shadow) {
        float[] pen = {x};
        Random rnd = new Random(lineSeed);
        // The run of glyphs under one click or hover event on this line: the events and where the run starts
        Object[] run = {null, null};
        float[] runStart = {0};
        // The game draws a line in its visual order, so right to left runs are reversed and Arabic letters take their joined forms
        Language.getInstance().getVisualOrder(line).accept((index, st, cp) -> {
            Glyph glyph = glyph(cp, st);
            if (!shadow && linkSink != null) {
                // The padding that centers a line is blank and never underlined, it says nothing about the line
                if (!Character.isWhitespace(cp) && !fontOf(st).equals("foxcraft_dungeon_loot:padding")) {
                    inkGlyphs++;
                    if (!st.isUnderlined() || st.getClickEvent() != null) plainGlyphs++;
                }
                Object click = st.getClickEvent(), hover = st.getHoverEvent() instanceof HoverEvent.ShowText ? st.getHoverEvent() : null;
                if (!Objects.equals(click, run[0]) || !Objects.equals(hover, run[1])) {
                    if (run[0] != null || run[1] != null) linkSink.add(new Object[] {runStart[0], y, pen[0] - runStart[0], (float) LINE_HEIGHT, run[0], run[1]});
                    run[0] = click;
                    run[1] = hover;
                    runStart[0] = pen[0];
                }
            }
            if (st.isObfuscated() && glyph.image() != null) {
                sawObfuscated = true;
                glyph = font(fontOf(st)).randomOfWidth(glyph, rnd);
            }
            float adv = glyph.advance() + (st.isBold() ? 1 : 0);
            int argb = 0xff000000 | (st.getColor() != null ? st.getColor().getValue() : textColor);
            // A tooltip shades its text a quarter as bright, the book screen draws none
            if (shadow) argb = st.getShadowColor() != null ? st.getShadowColor() : autoShadow ? 0xff000000 | ((argb & 0xfcfcfc) >> 2) : 0;
            if (argb >>> 24 != 0) {
                float gx = pen[0] + (shadow ? 1 : 0), gy = y + (shadow ? 1 : 0);
                draw(g, glyph, gx, gy, argb, st.isItalic());
                if (st.isBold()) draw(g, glyph, gx + 1, gy, argb, st.isItalic());
                g.setColor(new Color(argb, true));
                if (st.isStrikethrough()) g.fill(new java.awt.geom.Rectangle2D.Float((gx - 1) * scale, (gy + 3.5f) * scale, (adv + 1) * scale, scale));
                if (st.isUnderlined()) g.fill(new java.awt.geom.Rectangle2D.Float((gx - 1) * scale, (gy + LINE_HEIGHT - 1) * scale, (adv + 1) * scale, scale));
            }
            pen[0] += adv;
            return true;
        });
        if (!shadow && linkSink != null && (run[0] != null || run[1] != null)) linkSink.add(new Object[] {runStart[0], y, pen[0] - runStart[0], (float) LINE_HEIGHT, run[0], run[1]});
        return pen[0];
    }

    static void chunk(java.io.ByteArrayOutputStream out, String type, byte[] data) throws java.io.IOException {
        java.io.DataOutputStream d = new java.io.DataOutputStream(out);
        byte[] t = type.getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        java.util.zip.CRC32 crc = new java.util.zip.CRC32();
        crc.update(t);
        crc.update(data);
        d.writeInt(data.length);
        d.write(t);
        d.write(data);
        d.writeInt((int) crc.getValue());
    }

    /**
     * Writes frames as an animated PNG looping forever at ANIM_FPS. The first frame is also the default image, so a viewer
     * with no APNG support shows it as any other page. Each frame is encoded by ImageIO and its IDAT data reused, as fdAT for
     * all but the first.
     */
    static void writeApng(List<BufferedImage> frames, Path file) throws Exception {
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        out.write(new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a});
        int seq = 0;
        for (int n = 0; n < frames.size(); n++) {
            java.io.ByteArrayOutputStream encoded = new java.io.ByteArrayOutputStream();
            ImageIO.write(frames.get(n), "png", encoded);
            java.nio.ByteBuffer buf = java.nio.ByteBuffer.wrap(encoded.toByteArray());
            buf.position(8);
            byte[] ihdr = null;
            java.io.ByteArrayOutputStream idat = new java.io.ByteArrayOutputStream();
            while (buf.remaining() >= 12) {
                int len = buf.getInt();
                byte[] type = new byte[4];
                buf.get(type);
                byte[] data = new byte[len];
                buf.get(data);
                buf.getInt();
                String name = new String(type, java.nio.charset.StandardCharsets.US_ASCII);
                if (name.equals("IHDR")) ihdr = data;
                else if (name.equals("IDAT")) idat.write(data);
            }
            if (n == 0) {
                chunk(out, "IHDR", ihdr);
                java.nio.ByteBuffer ac = java.nio.ByteBuffer.allocate(8);
                ac.putInt(frames.size()).putInt(0);
                chunk(out, "acTL", ac.array());
            }
            java.nio.ByteBuffer fc = java.nio.ByteBuffer.allocate(26);
            fc.putInt(seq++).putInt(frames.get(n).getWidth()).putInt(frames.get(n).getHeight()).putInt(0).putInt(0);
            fc.putShort((short) 1).putShort((short) ANIM_FPS).put((byte) 0).put((byte) 0);
            chunk(out, "fcTL", fc.array());
            if (n == 0) {
                chunk(out, "IDAT", idat.toByteArray());
            } else {
                java.nio.ByteBuffer fd = java.nio.ByteBuffer.allocate(4 + idat.size());
                fd.putInt(seq++).put(idat.toByteArray());
                chunk(out, "fdAT", fd.array());
            }
        }
        chunk(out, "IEND", new byte[0]);
        Files.write(file, out.toByteArray());
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

    //region Tooltip

    /** Every set_lore function in a modifier or loot table JSON, in order, their lines added to lore. */
    static void collectLore(JsonElement el, List<JsonElement> lore) {
        if (el.isJsonObject()) {
            JsonObject o = el.getAsJsonObject();
            if (o.has("lore") && o.has("type") && o.get("type").getAsString().equals("minecraft:set_lore")) o.getAsJsonArray("lore").forEach(lore::add);
            else o.entrySet().forEach(e -> collectLore(e.getValue(), lore));
        } else if (el.isJsonArray()) {
            el.getAsJsonArray().forEach(e -> collectLore(e, lore));
        }
    }

    /** The first string in a JSON tree that is a rarity modifier id, null when there is none. */
    static String rarityId(JsonElement el) {
        if (el.isJsonPrimitive()) {
            String s = el.getAsString();
            return s.startsWith("foxcraft_dungeon_loot:rarity/") ? s : null;
        }
        Iterable<JsonElement> children = el.isJsonObject() ? el.getAsJsonObject().entrySet().stream().map(Map.Entry::getValue).toList()
            : el.isJsonArray() ? el.getAsJsonArray() : List.of();
        for (JsonElement c : children) {
            String found = rarityId(c);
            if (found != null) return found;
        }
        return null;
    }

    /** Draws a nine-slice sprite over a box of GUI pixels, the border copied and the rest stretched. */
    static void nineSlice(Graphics2D g, BufferedImage sprite, int border, int w, int h) {
        int s = sprite.getWidth();
        int[] sx = {0, border, s - border, s}, dx = {0, border, w - border, w};
        int[] sy = {0, border, s - border, s}, dy = {0, border, h - border, h};
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                g.drawImage(sprite, dx[i] * scale, dy[j] * scale, dx[i + 1] * scale, dy[j + 1] * scale, sx[i], sy[j], sx[i + 1], sy[j + 1], null);
            }
        }
    }

    /**
     * Draws the item tooltip of a book as the game shows it for the stack the loot table gives: the name, the author and
     * generation lines of a written book, then the lore of the modifier followed by the one the rarity modifier appends,
     * in the default lore style. Lines are read from the generated modifier and loot table, in the locale injected.
     */
    static void writeTooltip(JsonElement modifier, JsonElement table, String generated, Path out, StringSplitter splitter, RegistryOps<JsonElement> ops, BufferedImage background, BufferedImage frame) throws Exception {
        JsonObject content = findContent(modifier);
        JsonObject components = findComponents(modifier);
        Component name;
        if (components != null && components.has("minecraft:custom_name")) {
            name = ComponentSerialization.CODEC.parse(ops, components.get("minecraft:custom_name")).getOrThrow(e -> new IllegalStateException(e));
        } else {
            JsonElement title = content.get("title");
            name = Component.literal(title.isJsonObject() ? title.getAsJsonObject().get("raw").getAsString() : title.getAsString());
        }
        List<JsonElement> loreJson = new ArrayList<>();
        collectLore(modifier, loreJson);
        String rarity = rarityId(table);
        if (rarity != null) {
            Path file = root.resolve("data/foxcraft_dungeon_loot/item_modifier").resolve(rarity.substring("foxcraft_dungeon_loot:".length()) + ".json");
            if (Files.exists(file)) collectLore(JsonParser.parseString(Files.readString(file)), loreJson);
        }
        List<Component> lines = new ArrayList<>();
        lines.add(name);
        String author = content.has("author") ? content.get("author").getAsString() : "";
        lines.add(Component.translatable("book.byAuthor", author).withStyle(ChatFormatting.GRAY));
        // 0 original to 3 tattered, original when the book sets none
        int generation = content.has("generation") ? content.get("generation").getAsInt() : 0;
        lines.add(Component.translatable("book.generation." + generation).withStyle(ChatFormatting.GRAY));
        Style loreStyle = Style.EMPTY.withColor(ChatFormatting.DARK_PURPLE).withItalic(true);
        for (JsonElement l : loreJson) {
            lines.add(ComponentUtils.mergeStyles(ComponentSerialization.CODEC.parse(ops, l).getOrThrow(e -> new IllegalStateException(e)), loreStyle));
        }

        drawTooltip(new ArrayList<FormattedText>(lines), out, splitter, background, frame);
    }

    /** Draws lines of text as the game draws a tooltip, the frame and background sprites under white, shaded text. */
    static void drawTooltip(List<FormattedText> lines, Path out, StringSplitter splitter, BufferedImage background, BufferedImage frame) throws Exception {
        int width = 0;
        for (FormattedText c : lines) width = Math.max(width, (int) Math.ceil(splitter.stringWidth(c)));
        int height = lines.size() == 1 ? 8 : 10 * lines.size();
        // The text sits 3 pixels inside a box the sprites reach another 9 pixels beyond
        int pad = 12, w = width + 2 * pad, h = height + 2 * pad;
        BufferedImage image = new BufferedImage(w * scale, h * scale, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
        nineSlice(g, background, 9, w, h);
        nineSlice(g, frame, 10, w, h);
        textColor = 0xffffff;
        autoShadow = true;
        try {
            for (int i = 0; i < lines.size(); i++) {
                drawLine(g, lines.get(i), pad, pad + i * 10 + (i > 0 ? 2 : 0));
            }
        } finally {
            textColor = TEXT_COLOR;
            autoShadow = false;
        }
        g.dispose();
        ImageIO.write(image, "png", out.toFile());
    }

    /** The written_book_content object of a book modifier. */
    static JsonObject findContent(JsonElement el) {
        JsonObject components = findComponents(el);
        return components == null ? null : components.getAsJsonObject("minecraft:written_book_content");
    }

    /** The components object of the set_components function that holds the book content. */
    static JsonObject findComponents(JsonElement el) {
        if (el.isJsonObject()) {
            JsonObject o = el.getAsJsonObject();
            if (o.has("components") && o.get("components").isJsonObject() && o.getAsJsonObject("components").has("minecraft:written_book_content")) return o.getAsJsonObject("components");
            for (var e : o.entrySet()) {
                JsonObject found = findComponents(e.getValue());
                if (found != null) return found;
            }
        } else if (el.isJsonArray()) {
            for (JsonElement e : el.getAsJsonArray()) {
                JsonObject found = findComponents(e);
                if (found != null) return found;
            }
        }
        return null;
    }

    //endregion

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
        BufferedImage tooltipBackground, tooltipFrame;
        try (InputStream in = BookRender.class.getResourceAsStream("/assets/minecraft/textures/gui/sprites/tooltip/background.png")) { tooltipBackground = ImageIO.read(in); }
        try (InputStream in = BookRender.class.getResourceAsStream("/assets/minecraft/textures/gui/sprites/tooltip/frame.png")) { tooltipFrame = ImageIO.read(in); }

        // config.json mc.generatedDirectory, the folder the generator writes the books to
        java.util.regex.Matcher dirName = java.util.regex.Pattern.compile("\"generatedDirectory\"\\s*:\\s*\"([^\"]+)\"").matcher(Files.readString(root.resolve("config.json")));
        String generated = dirName.find() ? dirName.group(1) : "__generated__";
        Path modifiers = root.resolve("data/foxcraft_dungeon_loot/item_modifier/random_loot/book").resolve(generated);
        if (!Files.isDirectory(modifiers)) {
            out("no generated books in " + modifiers);
            System.exit(1);
        }
        if (Files.isDirectory(outDir)) try (Stream<Path> old = Files.walk(outDir)) {
            for (Path f : old.sorted(Comparator.reverseOrder()).toList()) Files.delete(f);
        }
        int books = 0, pagesDrawn = 0;
        Set<String> failures = new TreeSet<>();
        List<Path> files;
        try (Stream<Path> s = Files.walk(modifiers)) { files = s.filter(f -> f.toString().endsWith(".json")).sorted().toList(); }
        List<String> locales = locales();
        for (String locale : locales) {
            Language.inject(language(locale));
            for (Path file : files) {
                // The path under generated/ without the extension, <id> or <group>/<id>, as the source has it under src/books/<locale>
                String book = modifiers.relativize(file).toString().replace(java.io.File.separatorChar, '/').replaceFirst("\\.json$", "");
                List<JsonElement[]> pages = pagesOf(JsonParser.parseString(Files.readString(file)));
                if (pages == null) continue;
                // A book is in a locale only where it has a source there, the rest would just repeat the English
                if (!locale.equals("en_us") && !hasSource(root.resolve("src/books").resolve(locale), book)) continue;
                if (locale.equals("en_us")) books++;
                // With chat filtering on the book shows the filtered side of each page that has one, the raw side of the rest
                try {
                    Path table = root.resolve("data/foxcraft_dungeon_loot/loot_table/item/random_loot/book").resolve(generated).resolve(book + ".json");
                    JsonElement tableJson = Files.exists(table) ? JsonParser.parseString(Files.readString(table)) : new JsonObject();
                    Path dir = outDir.resolve(locale).resolve(book);
                    Files.createDirectories(dir);
                    at = locale + " " + book + " tooltip";
                    writeTooltip(JsonParser.parseString(Files.readString(file)), tableJson, generated, dir.resolve("tooltip.png"), splitter, ops, tooltipBackground, tooltipFrame);
                } catch (Exception e) {
                    failures.add(locale + " " + book + " tooltip: " + e);
                }
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

                        // Obfuscated text redraws as other glyphs every frame in game, so a page with some is written as an animated PNG
                        List<BufferedImage> frames = new ArrayList<>();
                        List<Object[]> pageLinks = new ArrayList<>();
                        sawObfuscated = false;
                        boolean heading = false;
                        for (int frame = 0; frame < (frames.isEmpty() || sawObfuscated ? ANIM_FRAMES : 1); frame++) {
                            obfuscationRandom = new Random(where.hashCode() * 31L + frame);
                            linkSink = frame == 0 ? pageLinks : null;
                            BufferedImage image = new BufferedImage(BOOK_SIZE * scale, BOOK_SIZE * scale, BufferedImage.TYPE_INT_ARGB);
                            Graphics2D g = image.createGraphics();
                            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
                            g.drawImage(background, 0, 0, BOOK_SIZE * scale, BOOK_SIZE * scale, null);
                            Component indicator = Component.translatable("book.pageIndicator", n + 1, pages.size());
                            drawLine(g, indicator, INDICATOR_RIGHT - splitter.stringWidth(indicator), INDICATOR_Y);
                            for (int i = 0; i < Math.min(lines.size(), MAX_LINES); i++) {
                                at = where + " line " + (i + 1);
                                inkGlyphs = 0;
                                plainGlyphs = 0;
                                float end = drawLine(g, lines.get(i), TEXT_X, TEXT_Y + i * LINE_HEIGHT);
                                if (frame == 0 && inkGlyphs > 0 && plainGlyphs == 0) heading = true;
                                if (end - TEXT_X > TEXT_WIDTH) failures.add(where + " line " + (i + 1) + " draws " + (end - TEXT_X) + " pixels wide, the page text is " + TEXT_WIDTH + " (shaped Arabic is wider than the game splits it, see scripts/books/README.md)");
                            }
                            g.dispose();
                            frames.add(image);
                        }
                        linkSink = null;
                        // A marker file for a page with a heading, the viewer shows it above the page slider
                        Path headingMark = dir.resolve(String.format("page_%02d.heading", n + 1));
                        if (heading) Files.writeString(headingMark, ""); else Files.deleteIfExists(headingMark);
                        if (!pageLinks.isEmpty()) {
                            JsonArray arr = new JsonArray();
                            // A hover text is drawn once for the runs that share it, to page_NN.hover_K.png
                            Map<Object, Integer> hovers = new HashMap<>();
                            for (Object[] l : pageLinks) {
                                JsonObject o = new JsonObject();
                                o.addProperty("x", (Float) l[0]); o.addProperty("y", (Float) l[1]); o.addProperty("w", (Float) l[2]); o.addProperty("h", (Float) l[3]);
                                if (l[4] instanceof ClickEvent.OpenUrl e) { o.addProperty("action", "open_url"); o.addProperty("value", e.uri().toString()); }
                                else if (l[4] instanceof ClickEvent.ChangePage e) { o.addProperty("action", "change_page"); o.addProperty("value", String.valueOf(e.page())); }
                                else if (l[4] instanceof ClickEvent.CopyToClipboard e) { o.addProperty("action", "copy_to_clipboard"); o.addProperty("value", e.value()); }
                                else if (l[4] instanceof ClickEvent.RunCommand e) { o.addProperty("action", "run_command"); o.addProperty("value", e.command()); }
                                else if (l[4] instanceof ClickEvent.SuggestCommand e) { o.addProperty("action", "suggest_command"); o.addProperty("value", e.command()); }
                                if (l[5] instanceof HoverEvent.ShowText h) {
                                    Integer k = hovers.get(h.value());
                                    if (k == null) {
                                        k = hovers.size() + 1;
                                        hovers.put(h.value(), k);
                                        List<FormattedText> hoverLines = splitter.splitLines(h.value(), 200, Style.EMPTY);
                                        drawTooltip(hoverLines, dir.resolve(String.format("page_%02d.hover_%d.png", n + 1, k)), splitter, tooltipBackground, tooltipFrame);
                                    }
                                    o.addProperty("hover", k);
                                }
                                arr.add(o);
                            }
                            Files.writeString(dir.resolve(String.format("page_%02d.links.json", n + 1)), arr.toString());
                        }
                        Path pagePng = dir.resolve(String.format("page_%02d.png", n + 1));
                        if (frames.size() > 1) writeApng(frames, pagePng);
                        else ImageIO.write(frames.get(0), "png", pagePng.toFile());
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
