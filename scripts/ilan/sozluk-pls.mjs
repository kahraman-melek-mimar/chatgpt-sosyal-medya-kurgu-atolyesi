// Telaffuz sözlüğünü ElevenLabs'e yüklenebilir .pls dosyasına çevirir (web arayüzünde/Studio'da kullanmak için).
// API akışı (ilan:seslendir) sözlüğü zaten kendisi uygular; bu dosya yalnızca elle üretimler içindir.
//   npm run ilan:sozluk → out/telaffuz-sozlugu.pls
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sozlukYukle } from "./lib/okunus.mjs";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const s = sozlukYukle();
const xml = (x) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const satirlar = Object.entries({ ...s.kisaltmalar, ...s.kelimeler }).map(
  ([g, a]) => `  <lexeme><grapheme>${xml(g)}</grapheme><alias>${xml(a)}</alias></lexeme>`,
);
const pls = `<?xml version="1.0" encoding="UTF-8"?>
<lexicon version="1.0" xmlns="http://www.w3.org/2005/01/pronunciation-lexicon" alphabet="ipa" xml:lang="tr-TR">
${satirlar.join("\n")}
</lexicon>
`;
mkdirSync(path.join(KOK, "out"), { recursive: true });
writeFileSync(path.join(KOK, "out/telaffuz-sozlugu.pls"), pls);
console.log(`✓ out/telaffuz-sozlugu.pls (${satirlar.length} kural) — ElevenLabs → Pronunciation Dictionaries'e yükleyin.`);
