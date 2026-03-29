/**
 * speech-utils.ts
 * Preprocessing pipeline for beautiful, eloquent ElevenLabs TTS.
 * Strips markdown → expands abbreviations → converts numbers/currency →
 * injects SSML prosody → returns clean, naturally paced text.
 */

// ─── Markdown stripper ────────────────────────────────────────────────────────

export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "code block omitted")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|[^\n]+\|/g, "")
    .replace(/^[-|]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Financial & regulatory abbreviations → spoken form ──────────────────────

const ABBREVIATIONS: [RegExp, string][] = [
  [/\bR2T4\b/g,   "Return to Title Four"],
  [/\bT4\b/g,     "Title Four"],
  [/\bHEA\b/g,    "the Higher Education Act"],
  [/\bFSA\b/g,    "Federal Student Aid"],
  [/\bSAP\b/g,    "Satisfactory Academic Progress"],
  [/\bEFC\b/g,    "Expected Family Contribution"],
  [/\bSAI\b/g,    "Student Aid Index"],
  [/\bCOD\b/g,    "Common Origination and Disbursement"],
  [/\bNSLDS\b/g,  "the National Student Loan Data System"],
  [/\bIFAP\b/g,   "IFAP — the Information for Financial Aid Professionals portal"],
  [/\bPJ\b/g,     "professional judgment"],
  [/\bCDR\b/g,    "cohort default rate"],
  [/\bFISAP\b/g,  "the Fiscal Operations Report and Application to Participate"],
  [/\bGAAP\b/g,   "Generally Accepted Accounting Principles"],
  [/\bGAGAS\b/g,  "Generally Accepted Government Auditing Standards"],
  [/\bOIG\b/g,    "the Office of Inspector General"],
  [/\bAOTC\b/g,   "the American Opportunity Tax Credit"],
  [/\bLLC\b/g,    "the Lifetime Learning Credit"],
  [/\bFAFSA\b/g,  "the FAFSA"],
  [/\b34 CFR\b/g, "Title 34 of the Code of Federal Regulations"],
  [/\bCFR\b/g,    "Code of Federal Regulations"],
  [/\bED\b/g,     "the Department of Education"],
  [/\bG5\b/g,     "the G5 payment system"],
];

export function expandAbbreviations(text: string): string {
  let out = text;
  for (const [pattern, replacement] of ABBREVIATIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// ─── Number, currency, and percentage conversion ─────────────────────────────

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven",
  "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
  "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty",
  "sixty", "seventy", "eighty", "ninety"];

function spellBelow1000(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + spellBelow1000(n % 100) : "");
}

function numberToWords(n: number): string {
  if (n === 0) return "zero";
  const parts: string[] = [];
  const scales = ["", " thousand", " million", " billion"];
  let remaining = Math.abs(Math.floor(n));
  let scaleIdx = 0;
  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk !== 0) parts.unshift(spellBelow1000(chunk) + scales[scaleIdx]);
    remaining = Math.floor(remaining / 1000);
    scaleIdx++;
  }
  return (n < 0 ? "negative " : "") + parts.join(" ");
}

function convertCurrency(match: string, dollars: string, cents: string | undefined): string {
  const dollarNum = parseInt(dollars.replace(/,/g, ""), 10);
  const dollarWords = numberToWords(dollarNum);
  if (cents && parseInt(cents, 10) > 0) {
    return `${dollarWords} dollars and ${numberToWords(parseInt(cents, 10))} cents`;
  }
  return `${dollarWords} dollar${dollarNum !== 1 ? "s" : ""}`;
}

export function convertNumbers(text: string): string {
  let out = text;

  // $127,450.00 or $3,698
  out = out.replace(/\$(\d{1,3}(?:,\d{3})*)(?:\.(\d{2}))?/g, (m, d, c) =>
    convertCurrency(m, d, c));

  // 34% → thirty-four percent
  out = out.replace(/(\d+(?:\.\d+)?)\s*%/g, (_, n) => {
    const num = parseFloat(n);
    if (Number.isInteger(num)) return `${numberToWords(num)} percent`;
    const [whole, dec] = n.split(".");
    return `${numberToWords(parseInt(whole, 10))} point ${[...dec].map(d => ONES[parseInt(d, 10)]).join(" ")} percent`;
  });

  // Standalone integers ≥ 1000 with commas: 10,000 → ten thousand
  out = out.replace(/\b(\d{1,3}(?:,\d{3})+)\b/g, (m) =>
    numberToWords(parseInt(m.replace(/,/g, ""), 10)));

  // Award years like 2024-25 → "twenty twenty-four to twenty-five"
  out = out.replace(/\b(20\d{2})-(2\d)\b/g, (_, y, s) =>
    `${numberToWords(parseInt(y, 10))} to twenty ${numberToWords(parseInt(s, 10))}`);

  return out;
}

// ─── Prosody shaping via natural punctuation ─────────────────────────────────
// We deliberately avoid SSML <break> tags — ElevenLabs reads them as literal
// text unless SSML parsing is explicitly enabled, which causes robotic output.
// Instead we shape prosody through punctuation the model natively understands.

export function addSSMLProsody(text: string): string {
  let out = text;

  // Paragraph breaks → full stop + blank line (model takes a natural breath)
  out = out.replace(/\n\n+/g, ".\n\n");

  // Single newlines → comma pause (light breath without sentence end)
  out = out.replace(/(?<!\.|,|;|:|\?|!)\n(?!\n)/g, ", ");

  // Em-dash → comma-space (natural emphasis pause)
  out = out.replace(/\s*—\s*/g, ", ");

  // Trailing semicolons → period (stronger pause at list boundaries)
  out = out.replace(/;\s*/g, ". ");

  // Ellipsis → comma (thoughtful pause)
  out = out.replace(/\.\.\./g, ", ");

  // Collapse multiple spaces/punctuation artifacts
  out = out.replace(/,\s*,/g, ",");
  out = out.replace(/ {2,}/g, " ");

  return out.trim();
}

// ─── Master pipeline ──────────────────────────────────────────────────────────

/**
 * beautifulEloquentSpeech()
 * Applies the full pipeline: strip markdown → expand abbreviations →
 * convert numbers/currency/percentages → inject SSML prosody.
 * Returns text ready to send to ElevenLabs.
 */
export function beautifulEloquentSpeech(text: string): string {
  let out = stripMarkdown(text);
  out = expandAbbreviations(out);
  out = convertNumbers(out);
  out = addSSMLProsody(out);
  return out;
}
