import com.ibm.icu.text.ArabicShaping;

import java.nio.file.*;
import java.util.*;

/**
 * Checks scripts/arabic_shaping.json, how the game's text renderer (ArabicShaping LETTERS_SHAPE, as FormattedBidiReorder uses it)
 * shapes each Arabic letter: whether it joins the letter before and after it, and the code points of its four forms. The book
 * generator reads it to measure a line as it is drawn. A file that is not what the shaper gives is written again and the
 * step fails, so the build and the tests are run once more with the new one. Run: ArabicShapingTable <file>.
 */
public class ArabicShapingTable {
    static final ArabicShaping SHAPING = new ArabicShaping(ArabicShaping.LETTERS_SHAPE);
    static final String DUAL = "ب"; // beh, joins both sides

    static String shape(String s) throws Exception { return SHAPING.shape(s); }

    static String hex(String s) {
        StringJoiner j = new StringJoiner(",");
        s.codePoints().forEach(cp -> j.add(Integer.toHexString(cp)));
        return j.toString();
    }

    public static void main(String[] args) throws Exception {
        StringBuilder out = new StringBuilder("{\n \"letters\": {\n");
        List<String> rows = new ArrayList<>();
        for (int cp = 0x0600; cp <= 0x06ff; cp++) {
            String c = new String(Character.toChars(cp));
            String iso = shape(c);
            // Joining the letter before it, the one after, both
            String fin = shape(DUAL + c), ini = shape(c + DUAL), med = shape(DUAL + c + DUAL);
            boolean joinsBefore = fin.length() == 2 && fin.codePointAt(1) != cp && !fin.substring(1).equals(iso);
            boolean joinsAfter = ini.length() == 2 && !ini.substring(0, 1).equals(iso);
            String f = fin.length() == 2 ? fin.substring(1) : iso;
            String i = ini.length() == 2 ? ini.substring(0, 1) : iso;
            String m = med.length() == 3 ? med.substring(1, 2) : iso;
            if (iso.equals(c) && f.equals(c) && i.equals(c) && m.equals(c)) continue;
            rows.add("  \"" + Integer.toHexString(cp) + "\": [\"" + hex(iso) + "\", \"" + hex(f) + "\", \"" + hex(i) + "\", \"" + hex(m) + "\"]");
        }
        out.append(String.join(",\n", rows)).append("\n },\n \"ligatures\": {\n");
        // The lam-alef ligatures: a lam before each alef, alone and after a joining letter
        List<String> ligs = new ArrayList<>();
        for (int alef : new int[] {0x0622, 0x0623, 0x0625, 0x0627}) {
            String a = new String(Character.toChars(alef));
            String iso = shape("ل" + a), fin = shape(DUAL + "ل" + a);
            ligs.add("  \"" + Integer.toHexString(alef) + "\": [\"" + hex(iso) + "\", \"" + hex(fin.substring(1)) + "\"]");
        }
        out.append(String.join(",\n", ligs)).append("\n }\n}\n");
        Path file = Path.of(args[0]);
        String current = Files.exists(file) ? Files.readString(file).replace("\r\n", "\n") : "";
        if (current.equals(out.toString())) {
            System.out.println("ArabicShapingTable: " + file + " is what the game's shaper gives");
            return;
        }
        Files.writeString(file, out.toString());
        System.out.println("FAIL " + file + " was not what the game's shaper gives, it is written again: run the build and the tests once more");
        System.exit(1);
    }
}
