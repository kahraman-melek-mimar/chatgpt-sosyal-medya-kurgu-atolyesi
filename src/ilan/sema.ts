// İlan Reels planı: tek bir JSON (work/ilan-plan.json) videonun tamamını tarif eder.
// Örnek: library/examples/ilan-plan.example.json. Tüm süreler SANİYE, tüm medya yolları public/ altına göre.
import { z } from "zod";

export const sahneSchema = z.object({
  tip: z.enum(["konusma", "mulk-video", "mulk-foto"]),
  /** public/ altındaki dosya; boş bırakılırsa lacivert yer tutucu çizilir (taslak için). */
  src: z.string().optional(),
  sure: z.number().positive(),
  /** Kaynak videonun kaçıncı saniyesinden başlanacağı (video sahneleri). */
  baslangic: z.number().min(0).default(0),
  /** mulk-foto için yavaş kamera hareketi; videoda hafif punch-in. */
  hareket: z.enum(["yok", "yakinlas", "uzaklas", "sola", "saga"]).default("yakinlas"),
  /** Kadrajın odak noktası (0–1); dikey olmayan kaynakta neyin görüneceğini belirler. */
  odak: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).default({ x: 0.5, y: 0.5 }),
  /** Mülk sahnelerinde sol altta görünen oda etiketi, ör. "SALON", "ANA YATAK ODASI". */
  etiket: z.string().optional(),
  /** Sahnenin sesi: konuşmada varsayılan açık, mülk videosunda kapalı. Seslendirme varken avatar sahnesi sessizdir. */
  ses: z.boolean().optional(),
  /**
   * Avatar (HeyGen) klibi seslendirmeyle aynı zaman çizelgesinde: klip, sahnenin videodaki başlangıcına karşılık gelen
   * yerden oynar, böylece dudaklar seslendirmeyle eşleşir. `baslangic` yok sayılır.
   */
  senkron: z.boolean().default(false),
});

export const ilanPlanSchema = z.object({
  fps: z.number().int().positive().default(30),
  ilan: z.object({
    tur: z.enum(["SATILIK", "KİRALIK"]),
    emlakTipi: z.string(), // "VİLLA", "DAİRE" …
    oda: z.string(), // "6+2"
    konum: z.string(), // "Gölbaşı / Karşıyaka Mh. - Ankara"
    konum2: z.string().optional(), // site adı
    fiyat: z.string().optional(), // "12.500.000 TL" — boşsa gösterilmez
  }),
  /** Bilgi çubuğu, 3–5 sütun. */
  ozellikler: z.array(z.object({ deger: z.string(), etiket: z.string() })).min(1).max(5),
  sahneler: z.array(sahneSchema).min(1),
  /** Başlık kartının ekranda kaldığı aralık (mutlak saniye). */
  baslik: z.object({ from: z.number().min(0), to: z.number() }),
  /** Bilgi çubuğunun aralığı; sütunlar `aralik` saniye arayla tek tek girer. */
  bilgi: z.object({ from: z.number().min(0), to: z.number(), aralik: z.number().default(0.25) }),
  /** Altyazı satırları (gömülü). Kısa tut: 2–6 kelime. */
  altyazi: z.array(z.object({ from: z.number(), to: z.number(), text: z.string() })).default([]),
  /** ElevenLabs seslendirmesi (npm run ilan:seslendir doldurur). `from`: videonun kaçıncı saniyesinde başlar. */
  seslendirme: z
    .object({ src: z.string(), from: z.number().min(0).default(0.3), ses: z.number().min(0).max(2).default(1) })
    .optional(),
  muzik: z
    .object({
      src: z.string(),
      ses: z.number().min(0).max(1).default(0.22),
      /** Konuşma sahnelerinde müzik bu orana iner. */
      konusmadaSes: z.number().min(0).max(1).default(0.08),
    })
    .optional(),
  kapanis: z.object({
    sure: z.number().positive().default(4),
    slogan: z.string().default("Doğru yatırım, doğru danışmanla mümkün."),
  }),
  danisman: z.object({
    ad: z.string(),
    unvan: z.string().default("Gayrimenkul Danışmanı"),
    telefon: z.string(),
    ofis: z.string().optional(), // "Parla Gayrimenkul"
    portre: z.string().default("marka/portre.png"),
    logo: z.string().default("marka/cb-logo-cerceveli.png"),
  }),
});

export type IlanPlan = z.infer<typeof ilanPlanSchema>;
export type Sahne = z.infer<typeof sahneSchema>;

export const toplamSure = (p: IlanPlan) => p.sahneler.reduce((s, x) => s + x.sure, 0) + p.kapanis.sure;
