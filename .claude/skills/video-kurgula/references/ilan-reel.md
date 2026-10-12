# İlan Reels — dikey emlak videosu kompozisyonu (IlanReel)

Bu kullanıcının varsayılan dikey videosu: danışmanın konuşma çekimleri ile mülk videoları/fotoğrafları art arda,
Coldwell Banker kimliğiyle. 1080×1920, 30 fps, H.264 SDR Rec.709 + AAC. Tek dosya → Instagram Reels/Story, TikTok,
WhatsApp Durum. Eski 16:9 hattından (src/index.ts, work/edit-plan.json, scripts/60–80) tamamen bağımsızdır.

## Dosyalar

| Yol | Rol |
|---|---|
| `src/ilan/giris.ts` | Remotion giriş noktası (yalnızca IlanReel) |
| `src/ilan/IlanRoot.tsx` | Kompozisyon kaydı; süreyi plandan hesaplar |
| `src/ilan/IlanReel.tsx` | Sahneler, üst bant, başlık kartı, bilgi çubuğu, oda etiketi, altyazı, kapanış, müzik |
| `src/ilan/sema.ts` | Plan şeması (zod) — alan açıklamaları burada |
| `src/ilan/tema.ts` | CB renkleri (#012169), yerel fontlar, güvenli alan sabitleri |
| `public/fonts/` | Poppins + Cormorant Garamond (SIL OFL), internetsiz render |
| `public/marka/` | `cb-logo-cerceveli.png`, `portre.png` |
| `library/examples/ilan-plan.example.json` | Örnek plan (medyasız → lacivert yer tutucular) |
| `work/ilan-plan.json` | Bu videonun planı (git'e girmez) |

## Akış

1. Medyayı `public/assets/` içine koy (konuşma klipleri, mülk videoları, fotoğraflar, müzik).
2. `cp library/examples/ilan-plan.example.json work/ilan-plan.json` ve doldur:
   - `ilan`: tür (SATILIK/KİRALIK), emlak tipi, oda, konum, site, isteğe bağlı fiyat
   - `ozellikler`: 3–5 sütun (değer + etiket)
   - `sahneler`: sırayla `konusma` / `mulk-video` / `mulk-foto`; `sure` (sn), `baslangic` (videoda kaçıncı sn),
     `hareket` (yakinlas/uzaklas/sola/saga/yok), `odak` (yatay kaynakta neyin görüneceği, 0–1), `etiket` (oda adı)
   - `baslik` ve `bilgi`: mutlak saniye aralıkları (başlık ilk ~6 sn, bilgi çubuğu ardından)
   - `altyazi`: kısa satırlar, konuşmayla eşzamanlı (deşifre: `npm run transcribe` veya elle)
   - `muzik`: dosya + seviye; konuşma sahnelerinde otomatik kısılır, son 1 sn söner
   - `danisman`: ad, unvan, telefon, ofis (proje dokümanı `danisman-iletisim-bilgileri.md` ile aynı tut)
3. Kontrol: `npm run ilan:studio` (canlı önizleme) veya `npm run ilan:still -- --frame=<n>`.
   Kareleri güvenli alan çizgileriyle oku (`dikey-format.md`).
4. Render: `npm run ilan:render` → `out/final-dikey.mp4`. `ffprobe` ile 1080×1920, yuv420p, bt709, süre doğrula.
5. Video 90 sn'yi aşarsa WhatsApp için ≤ 90 sn'lik ikinci plan.

## Yerleşim kuralları (kodda sabit)

- Üst bant y 290: solda lacivert SATILIK/KİRALIK etiketi, sağda beyaz rozet içinde çerçeveli CB logosu
  (çerçeveli logo yalnızca açık zeminde — kurumsal kimlik kılavuzu).
- Başlık kartı y ≈ 478–720: "VİLLA 6+2" (Poppins 800), ince beyaz çizgi, konum (Garamond italik), site adı.
- Bilgi çubuğu y ≈ 500: beyaz kart, lacivert değerler, gri etiketler, sütunlar tek tek girer.
- Oda etiketi y 1000 solda; altyazı sol hizalı x 65–840, alt kenar y 1240 (buton sütununa ve açıklamaya girmez).
- Kapanış (son `kapanis.sure` sn): lacivert zemin, logo, dairesel portre, ad + unvan + ofis, "HEMEN ARAYIN" +
  en büyük öğe olarak telefon, Garamond italik slogan. Tüm kapanış y < 1250.
- Konuşma sahnelerinde ses açık, mülk sahnelerinde kapalı (`ses` ile değiştirilebilir).

## Doğrulandı (ilk kurulum, Ekim 2026)

Test medyasıyla 21 sn'lik tam render: 630/630 kare, 1080×1920, H.264 yuv420p tv-range bt709, AAC 48 kHz.
Kareler güvenli alan çizgileriyle incelendi: kritik öğelerin tamamı içeride. Gerçek çekimle ilk videoda
yatay kaynak kadrajı (`odak`) ve altyazı okunurluğu ayrıca kontrol edilmeli.
