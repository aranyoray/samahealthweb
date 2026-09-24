// Serialise a JSON-LD graph for injection into a <script> tag.
//
// JSON.stringify leaves `<`, U+2028 and U+2029 intact. A `</script>` sequence
// inside any string value would close the tag early, and the two line
// separators are literal newlines to a JS parser. Escaping them keeps the
// payload valid JSON-LD while making it safe to embed.
//
// The separators are built with fromCharCode rather than written literally so
// this source file can never itself contain the characters it guards against.
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);
const UNSAFE = new RegExp(`[<${LINE_SEP}${PARA_SEP}]`, "g");

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  [LINE_SEP]: "\\u2028",
  [PARA_SEP]: "\\u2029",
};

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, (c) => ESCAPES[c]);
}
