# Dikey format — platform ölçüleri ve güvenli alan

> Bu kullanıcının varsayılan formatı. Ekim 2026'da kontrol edildi. Platformlar arayüzlerini sık değiştirir: ilk
> yüklemede telefonda kontrol ettir ve bir şey kaydıysa bu dosyayı güncelle.

## Platformlar

| Platform | Oran | Çözünürlük | Süre | Not |
|---|---|---|---|---|
| Instagram Reels | **9:16** | 1080×1920 | 20 dk'ya kadar yüklenir; 3 dk üstü yeni kitleye önerilmez | 4:5 Reels oranı DEĞİL; 4:5 akıştaki normal video gönderisinin oranı |
| Instagram profil ızgarası | 3:4 kesit | 1080×1440 görünür alan | — | 1080×1920 kapaktan üstten 240, alttan 240 px kesilir |
| Instagram Story | **9:16** | 1080×1920 | — | Reels ile aynı dosya |
| TikTok | **9:16** | 1080×1920 (en az 720×1280) | — | MP4 / H.264 önerilir; kaynak fps'i koru (23–60) |
| WhatsApp Durum | **9:16** | 1080×1920 | **en fazla 90 sn** | Üstte gönderen adı, altta yanıt çubuğu; ana içerik ortadaki ~1080×1600 alanda |

Sonuç: **tek bir 1080×1920 master** dördünü de karşılar. Farklı bir oran üretme.

## Ortak güvenli alan (1080×1920 üzerinde, en katı platforma göre)

| Kenar | Boş bırak | Neden |
|---|---|---|
| Üst | 0–280 px | kullanıcı adı, ses etiketi, durum çubuğu (IG ≈ %14) |
| Alt | son ~670 px (y > 1250) | açıklama, ses parçası, WhatsApp yanıt çubuğu (IG ≈ %35) |
| Sağ alt | x > 850, y > 960 | beğen/yorum/paylaş sütunu |
| Yanlar | ≥ 65 px | ekran kenarı |

Grafik bandı: **y ≈ 290–720**, konuşmacı bunun altında. Telefon numarası, logo, başlık gibi kritik her şey
yukarıdaki sınırların içinde kalır. Kapak başlığı ızgara kesitinin içinde (y 240–1680) olmalı.

## Teslim kodlaması

- 1080×1920, 30 fps (kaynak 60 fps ise 30'a indir, kullanıcı aksini istemedikçe)
- H.264 High, yuv420p, **SDR Rec.709** (iPhone HDR çekim SDR dalından tone-map edilir; sosyal uygulamalar HDR'ı
  tutarsız gösterir)
- AAC 48 kHz stereo, -14 LUFS civarı
- MP4, `+faststart`
- Video 90 sn'den uzunsa WhatsApp için ayrıca ≤ 90 sn'lik bir kesim

## Kaynaklar

- https://socialsizes.io/instagram-reels-size/
- https://www.hopperhq.com/blog/instagram-reel-size/
- https://www.renderforest.com/blog/tiktok-video-specs-dimensions
- https://moda.app/resources/sizes/whatsapp-status
