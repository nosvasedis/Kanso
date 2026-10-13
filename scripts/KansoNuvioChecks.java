import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.regex.Pattern;

/** Java equivalents of Nuvio TV 1.0.0's Character direction and Pattern checks.
 * This checks native semantics, not a running Compose UI or media playback. */
class KansoNuvioChecks {
    record Filter(String id, Pattern pattern) {}
    static String decode(String value) {
        return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
    }
    static String direction(String text) {
        for (int offset = 0; offset < text.length();) {
            int point = text.codePointAt(offset);
            byte bidi = Character.getDirectionality(point);
            if (bidi == Character.DIRECTIONALITY_RIGHT_TO_LEFT ||
                bidi == Character.DIRECTIONALITY_RIGHT_TO_LEFT_ARABIC) return "R";
            if (bidi == Character.DIRECTIONALITY_LEFT_TO_RIGHT) return "L";
            offset += Character.charCount(point);
        }
        return "L";
    }
    public static void main(String[] args) throws Exception {
        var packs = new HashMap<String, List<Filter>>();
        int titles = 0, reproducedRtl = 0, cases = 0, filters = 0;
        for (String line : Files.readAllLines(Path.of(args[0]), StandardCharsets.UTF_8)) {
            String[] parts = line.split("\t", -1);
            switch (parts[0]) {
                case "P" -> {
                    packs.computeIfAbsent(parts[1], key -> new ArrayList<>())
                        .add(new Filter(parts[2], Pattern.compile(decode(parts[3]))));
                    filters++;
                }
                case "T" -> {
                    String title = decode(parts[2]);
                    if (!direction(title).equals("L")) throw new AssertionError("RTL title: " + decode(parts[1]));
                    if (direction(title.substring(1)).equals("R")) reproducedRtl++;
                    titles++;
                }
                case "C" -> {
                    var candidates = decode(parts[3]).split("\u0000", -1);
                    var actual = new LinkedHashSet<String>();
                    for (Filter filter : packs.get(parts[1])) {
                        for (String candidate : candidates) {
                            if (filter.pattern.matcher(candidate).find()) { actual.add(filter.id); break; }
                        }
                    }
                    var expected = parts[4].isEmpty() ? Set.<String>of() : new LinkedHashSet<>(Arrays.asList(parts[4].split(",")));
                    if (!actual.equals(expected)) throw new AssertionError(decode(parts[2]) + ": Java " + actual + " != expected " + expected);
                    cases++;
                }
                default -> throw new AssertionError("Unknown test record");
            }
        }
        if (reproducedRtl == 0) throw new AssertionError("The suite did not reproduce the previous RTL defect");
        System.out.printf("PASS: Java checked %d native regexes, %d badge cases and %d LTR titles; removing the anchor reproduced RTL in %d titles.%n", filters, cases, titles, reproducedRtl);
    }
}
