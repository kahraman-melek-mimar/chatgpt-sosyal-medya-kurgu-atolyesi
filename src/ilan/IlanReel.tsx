// İLAN REELS — dikey 1080×1920 emlak tanıtım videosu (Instagram Reels/Story, TikTok, WhatsApp Durum).
// Danışmanın konuşma çekimleri ile mülk video/fotoğrafları art arda; üstünde Coldwell Banker kimliğiyle
// ilan etiketi + logo, başlık kartı, bilgi çubuğu, oda etiketleri, altyazı; sonda danışman kapanış kartı.
// Tüm içerik `IlanPlan` verisinden gelir (src/ilan/sema.ts); bu dosyada ilana özgü metin yoktur.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio, Video } from "@remotion/media";
import { GECIS_SN, IlanPlan, Sahne, toplamSure } from "./sema";
import { guvenli as G, renk, yazi } from "./tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Kurgu klasörüne göre dosya yolu ("medya/salon.jpg" → "kurgular/<ad>/medya/salon.jpg"). */
const dosya = (klasor: string | undefined, src: string) => staticFile(klasor ? `${klasor}/${src}` : src);
const yumusak = Easing.bezier(0.16, 1, 0.3, 1);
const tr = (s: string) => s.toLocaleUpperCase("tr-TR");

/** 0→1 giriş, 1→0 çıkış; saniye cinsinden pencere. */
const pencere = (t: number, from: number, to: number, giris = 0.45, cikis = 0.35) =>
  Math.min(
    interpolate(t, [from, from + giris], [0, 1], { ...clamp, easing: yumusak }),
    interpolate(t, [to - cikis, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) }),
  );

// ───────────────────────── arka plan: sahneler ─────────────────────────

const SahneGorsel: React.FC<{ s: Sahne; frames: number; senkronBas: number; klasor?: string }> = ({ s, frames, senkronBas, klasor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (s.tip === "ara-kart") return <AraKart s={s} />;
  // Kayma geçişinde sahne, sonrakinin altında birkaç kare daha görünür: hareket ve ses o kuyrukta durur.
  const p = frames > 1 ? Math.min(frame, frames - 1) / (frames - 1) : 0;
  const foto = s.tip === "mulk-foto";
  // Fotoğrafta belirgin, videoda hafif hareket (gerçek mimariyi bozmadan, sadece kadraj).
  const guc = foto ? 1 : 0.35;
  let olcek = 1.06;
  let dx = 0;
  if (s.hareket === "yakinlas") olcek = 1.04 + 0.1 * guc * p;
  if (s.hareket === "uzaklas") olcek = 1.04 + 0.1 * guc * (1 - p);
  if (s.hareket === "sola") dx = interpolate(p, [0, 1], [30, -30]) * guc;
  if (s.hareket === "saga") dx = interpolate(p, [0, 1], [-30, 30]) * guc;
  if (s.hareket === "yok") olcek = 1;
  const pos = `${s.odak.x * 100}% ${s.odak.y * 100}%`;
  const stil: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: pos,
    transform: `translateX(${dx}px) scale(${olcek})`,
    transformOrigin: pos,
  };
  if (!s.src) {
    // Taslak yer tutucu: medya henüz yokken yerleşim ve zamanlama kontrol edilebilsin.
    return (
      <AbsoluteFill style={{ background: `linear-gradient(160deg, #2A3B5E, ${renk.cbMaviKoyu})`, alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: yazi.sans, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: "rgba(255,255,255,0.35)" }}>
          {tr(s.tip.replace("-", " "))} · {s.sure}s
        </div>
      </AbsoluteFill>
    );
  }
  if (foto) return <Img src={dosya(klasor, s.src)} style={stil} />;
  // Seslendirmeyle senkron avatar sesi kapalıdır (ses seslendirme kanalından gelir).
  const sesAcik = s.senkron ? false : (s.ses ?? s.tip === "konusma");
  const bas = s.senkron ? Math.max(0, senkronBas) : s.baslangic;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Video
        src={dosya(klasor, s.src)}
        trimBefore={Math.round(bas * fps)}
        muted={!sesAcik}
        volume={(f) => (f < frames ? 1 : 0)}
        objectFit="cover"
        style={stil}
      />
    </AbsoluteFill>
  );
};

/** Sahne sınırları (saniye): her sahnenin başı, süresi ve giriş geçişi. */
const sahneZamanlari = (plan: IlanPlan) => {
  let bas = 0;
  return plan.sahneler.map((s, i) => {
    const r = { s, i, bas, gecis: i === 0 ? ("kesme" as const) : s.gecis };
    bas += s.sure;
    return r;
  });
};

/**
 * Sahneler + giriş geçişleri (references/gecisler.md). kayma: önceki sahne kayma süresi kadar uzatılır ve yeni sahne
 * onun üstüne sağdan iter. perde/karartma: sınırda ayrı bir örtü katmanı (GecisOrtusu) kesmeyi gizler.
 */
const SahneKatmani: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const { fps } = useVideoConfig();
  const z = sahneZamanlari(plan);
  return (
    <>
      {z.map(({ s, i, bas, gecis }) => {
        const from = Math.round(bas * fps);
        const frames = Math.round(s.sure * fps);
        const sonraki = z[i + 1];
        const kuyruk = sonraki?.gecis === "kayma" ? Math.round(GECIS_SN.kayma * fps) : 0;
        // Senkron avatar: klipte, sahnenin başladığı an eksi seslendirmenin başladığı an kadar ileri sar.
        const senkronBas = bas - (plan.seslendirme?.from ?? 0);
        return (
          <Sequence key={i} from={from} durationInFrames={frames + kuyruk} premountFor={fps}>
            <SahneGecisi gecis={gecis} frames={frames} kuyruk={kuyruk}>
              <SahneGorsel s={s} frames={frames} senkronBas={senkronBas} klasor={plan.klasor} />
            </SahneGecisi>
          </Sequence>
        );
      })}
    </>
  );
};

const SahneGecisi: React.FC<{ gecis: Sahne["gecis"]; frames: number; kuyruk: number; children: React.ReactNode }> = ({ gecis, frames, kuyruk, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let opak = 1;
  let x = 0;
  if (gecis === "yumusak") opak = interpolate(frame, [0, 6], [0.35, 1], clamp);
  if (gecis === "kayma") x = interpolate(frame, [0, GECIS_SN.kayma * fps], [G.W, 0], { ...clamp, easing: yumusak });
  // Sonraki sahne kayarak gelirken bu sahne sola itilir (tam çıkmaz, altında kalır).
  if (kuyruk > 0) x += interpolate(frame, [frames, frames + kuyruk], [0, -G.W * 0.35], { ...clamp, easing: yumusak });
  return (
    <AbsoluteFill style={{ opacity: opak, transform: x ? `translateX(${x}px)` : undefined, backgroundColor: renk.cbMaviKoyu, overflow: "hidden" }}>
      {children}
    </AbsoluteFill>
  );
};

/** perde / karartma: sahne sınırının iki yanına yayılan örtü; kesme, örtü ekranı tam kapladığı karede olur. */
const GecisOrtusu: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const katmanlar = sahneZamanlari(plan).map(({ bas, gecis, i }) => {
    if (gecis !== "perde" && gecis !== "karartma") return null;
    const b = bas * fps;
    const yari = (GECIS_SN[gecis] * fps) / 2;
    if (frame < b - yari || frame > b + yari) return null;
    if (gecis === "karartma") {
      const o = interpolate(frame, [b - yari, b, b + yari], [0, 1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      return <AbsoluteFill key={i} style={{ backgroundColor: renk.cbMaviKoyu, opacity: o }} />;
    }
    // Perde: CB mavisi panel soldan sağa geçer; sınır karesinde ekranı tamamen kaplar. Ön/arka kenarda ince beyaz çizgi.
    const g = G.W * 1.15;
    const sol = interpolate(frame, [b - yari, b, b + yari], [-g, -(g - G.W) / 2, G.W], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    return (
      <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: sol, width: g, background: renk.cbMavi }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 6, background: renk.beyaz, opacity: 0.85 }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 6, background: renk.beyaz, opacity: 0.85 }} />
      </div>
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{katmanlar}</AbsoluteFill>;
};

/** Bölüm arası köprü kartı: lacivert zemin, küçük üst etiket, büyüyen ince çizgi, Garamond italik köprü cümlesi. */
const AraKart: React.FC<{ s: Sahne }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = (d: number, sure = 0.5) => interpolate(t, [d, d + sure], [0, 1], { ...clamp, easing: yumusak });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #0A2E80 0%, ${renk.cbMavi} 50%, ${renk.cbMaviKoyu} 100%)` }}>
      {/* Güvenli alan içinde, dikey ortaya yakın (y ≈ 780–1080); sağ buton sütununa girmez. */}
      <div style={{ position: "absolute", top: 780, left: G.yan + 20, right: G.W - G.sagButonX + 20, textAlign: "center", color: renk.beyaz }}>
        {s.ust ? (
          <div style={{ fontFamily: yazi.sans, fontWeight: 600, fontSize: 28, letterSpacing: 7, color: renk.griAcik, opacity: g(0.1) }}>{tr(s.ust)}</div>
        ) : null}
        <div style={{ height: 3, width: 160 * g(0.2, 0.6), background: renk.beyaz, margin: "22px auto 26px", borderRadius: 2 }} />
        <div style={{ fontFamily: yazi.serif, fontStyle: "italic", fontWeight: 600, fontSize: 74, lineHeight: 1.12, opacity: g(0.3), transform: `translateY(${(1 - g(0.3)) * 18}px)` }}>
          {s.metin}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── üst bant: etiket + logo ─────────────────────────

const LogoRozet: React.FC<{ src: string; yukseklik: number }> = ({ src, yukseklik }) => (
  // Çerçeveli logo yalnızca açık zeminde kullanılır (kılavuz s.7) → beyaz rozet; güvenlik boşluğu = logonun yarısı kadar.
  <div style={{ background: renk.beyaz, borderRadius: 18, padding: `${yukseklik * 0.14}px ${yukseklik * 0.18}px`, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
    <Img src={staticFile(src)} style={{ height: yukseklik, display: "block" }} />
  </div>
);

const UstBant: React.FC<{ plan: IlanPlan; t: number; bitis: number }> = ({ plan, t, bitis }) => {
  const o = pencere(t, 0.1, bitis, 0.5, 0.3);
  return (
    <div style={{ position: "absolute", top: G.ust, left: G.yan, right: G.yan, display: "flex", justifyContent: "space-between", alignItems: "flex-start", opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
        <div style={{ background: renk.cbMavi, color: renk.beyaz, fontFamily: yazi.sans, fontWeight: 700, fontSize: 30, letterSpacing: 4, padding: "12px 24px", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          {tr(plan.ilan.tur)}
        </div>
      </div>
      <LogoRozet src={plan.danisman.logo} yukseklik={118} />
    </div>
  );
};

// ───────────────────────── başlık kartı ─────────────────────────

const BaslikKarti: React.FC<{ plan: IlanPlan; t: number }> = ({ plan, t }) => {
  const { from, to } = plan.baslik;
  const o = pencere(t, from, to, 0.55, 0.35);
  const y = interpolate(t, [from, from + 0.6], [40, 0], { ...clamp, easing: yumusak });
  const cizgi = interpolate(t, [from + 0.25, from + 0.9], [0, 1], { ...clamp, easing: yumusak });
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 478, left: G.yan, right: G.yan, opacity: o, transform: `translateY(${y}px)`, color: renk.beyaz }}>
      <div style={{ fontFamily: yazi.sans, fontWeight: 800, fontSize: 112, lineHeight: 1, letterSpacing: -2, textShadow: "0 8px 30px rgba(0,0,0,0.45)" }}>
        {tr(plan.ilan.emlakTipi)} <span style={{ fontWeight: 600 }}>{plan.ilan.oda}</span>
      </div>
      <div style={{ height: 4, width: 220 * cizgi, background: renk.beyaz, margin: "22px 0 18px", borderRadius: 2 }} />
      <div style={{ fontFamily: yazi.serif, fontStyle: "italic", fontWeight: 600, fontSize: 50, lineHeight: 1.1, textShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>{plan.ilan.konum}</div>
      {plan.ilan.konum2 ? (
        <div style={{ fontFamily: yazi.sans, fontWeight: 500, fontSize: 30, letterSpacing: 3, marginTop: 10, color: renk.griAcik }}>{tr(plan.ilan.konum2)}</div>
      ) : null}
      {plan.ilan.fiyat ? (
        <div style={{ display: "inline-block", marginTop: 22, background: renk.beyaz, color: renk.cbMavi, fontFamily: yazi.sans, fontWeight: 800, fontSize: 46, padding: "8px 22px", borderRadius: 12 }}>{plan.ilan.fiyat}</div>
      ) : null}
    </div>
  );
};

// ───────────────────────── bilgi çubuğu ─────────────────────────

const BilgiCubugu: React.FC<{ plan: IlanPlan; t: number }> = ({ plan, t }) => {
  const { from, to, aralik } = plan.bilgi;
  const o = pencere(t, from, to, 0.4, 0.35);
  if (o <= 0) return null;
  const n = plan.ozellikler.length;
  const y = interpolate(t, [from, from + 0.5], [30, 0], { ...clamp, easing: yumusak });
  return (
    <div style={{ position: "absolute", top: 500, left: G.yan, right: G.yan, opacity: o, transform: `translateY(${y}px)` }}>
      <div style={{ display: "flex", background: "rgba(255,255,255,0.96)", borderRadius: 24, padding: "26px 8px", boxShadow: "0 14px 40px rgba(0,0,0,0.3)" }}>
        {plan.ozellikler.map((oz, i) => {
          const g = interpolate(t, [from + 0.15 + i * aralik, from + 0.15 + i * aralik + 0.35], [0, 1], { ...clamp, easing: yumusak });
          return (
            <div key={i} style={{ flex: 1, textAlign: "center", borderLeft: i > 0 ? "2px solid #D5DBE6" : "none", opacity: g, transform: `translateY(${(1 - g) * 14}px)` }}>
              <div style={{ fontFamily: yazi.sans, fontWeight: 700, fontSize: n >= 5 ? 40 : 46, color: renk.cbMavi, lineHeight: 1.05, whiteSpace: "nowrap" }}>{oz.deger}</div>
              <div style={{ fontFamily: yazi.sans, fontWeight: 500, fontSize: 21, letterSpacing: 2.5, color: renk.gri, marginTop: 8 }}>{tr(oz.etiket)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────────────── oda etiketi + altyazı ─────────────────────────

const OdaEtiketi: React.FC<{ metin: string; frames: number }> = ({ metin, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = pencere(frame / fps, 0.2, frames / fps, 0.4, 0.3);
  return (
    <div style={{ position: "absolute", left: G.yan, top: 1000, opacity: o, transform: `translateX(${(1 - o) * -24}px)`, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 8, height: 46, background: renk.beyaz, borderRadius: 4 }} />
      <div style={{ background: renk.cbMavi, color: renk.beyaz, fontFamily: yazi.sans, fontWeight: 600, fontSize: 30, letterSpacing: 3.5, padding: "10px 20px", borderRadius: 10 }}>{tr(metin)}</div>
    </div>
  );
};

const Altyazi: React.FC<{ plan: IlanPlan; t: number }> = ({ plan, t }) => {
  const cur = plan.altyazi.find((a) => t >= a.from && t < a.to);
  if (!cur) return null;
  const o = pencere(t, cur.from, cur.to, 0.12, 0.08);
  return (
    // Sol hizalı, x 65–840: sağ alttaki buton sütununa (x > 850) taşmaz; alt sınır y 1240.
    <div style={{ position: "absolute", left: G.yan, width: G.sagButonX - 10 - G.yan, bottom: G.H - 1240, opacity: o }}>
      <span
        style={{
          fontFamily: yazi.sans,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.32,
          color: renk.beyaz,
          background: "rgba(1,33,105,0.88)",
          padding: "4px 16px",
          borderRadius: 10,
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {cur.text}
      </span>
    </div>
  );
};

// ───────────────────────── kapanış kartı ─────────────────────────

const Kapanis: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = (d: number) => interpolate(t, [d, d + 0.5], [0, 1], { ...clamp, easing: yumusak });
  const d = plan.danisman;
  const portre = 300;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #0A2E80 0%, ${renk.cbMavi} 45%, ${renk.cbMaviKoyu} 100%)`, opacity: g(0) }}>
      <div style={{ position: "absolute", top: G.ust, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: g(0.1) }}>
        <LogoRozet src={d.logo} yukseklik={130} />
      </div>
      <div style={{ position: "absolute", top: 500, left: (G.W - portre - 16) / 2, opacity: g(0.25), transform: `scale(${0.92 + 0.08 * g(0.25)})` }}>
        <div style={{ width: portre + 16, height: portre + 16, borderRadius: "50%", background: renk.beyaz, padding: 8, boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
          <Img src={staticFile(d.portre)} style={{ width: portre, height: portre, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 22%" }} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 846, left: G.yan, right: G.yan, textAlign: "center", color: renk.beyaz, opacity: g(0.45) }}>
        <div style={{ fontFamily: yazi.sans, fontWeight: 700, fontSize: 60, lineHeight: 1.1 }}>{d.ad}</div>
        <div style={{ fontFamily: yazi.sans, fontWeight: 500, fontSize: 26, letterSpacing: 4, color: renk.griAcik, marginTop: 8 }}>
          {tr(d.unvan)}
          {d.ofis ? ` · ${tr(d.ofis)}` : ""}
        </div>
      </div>
      {/* Telefon: en büyük ve en belirgin öğe (danışman talebi). Ortalı kutu x ≈ 284–796: buton sütununa (x > 850) değmez. */}
      <div style={{ position: "absolute", top: 1010, left: G.yan, right: G.yan, textAlign: "center", opacity: g(0.65), transform: `translateY(${(1 - g(0.65)) * 20}px)` }}>
        <div style={{ fontFamily: yazi.sans, fontWeight: 600, fontSize: 24, letterSpacing: 6, color: "#9CC3FF", display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: renk.yesil, display: "inline-block" }} />
          HEMEN ARAYIN
        </div>
        <div style={{ display: "inline-block", marginTop: 12, background: renk.beyaz, color: renk.cbMavi, fontFamily: yazi.sans, fontWeight: 800, fontSize: 64, letterSpacing: 1, padding: "10px 30px", borderRadius: 18, whiteSpace: "nowrap" }}>
          {d.telefon}
        </div>
      </div>
      <div style={{ position: "absolute", top: 1180, left: 120, right: 120, textAlign: "center", fontFamily: yazi.serif, fontStyle: "italic", fontWeight: 500, fontSize: 38, color: renk.griAcik, opacity: g(0.9) }}>
        {plan.kapanis.slogan}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── ses ─────────────────────────

const Muzik: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const m = plan.muzik;
  if (!m) return null;
  // Seslendirmenin bittiği kare: altyazı sonu yaklaşık olarak kullanılır (ses dosyası süresi render'da bilinmez).
  const sesSonu = plan.altyazi.length ? Math.round(plan.altyazi[plan.altyazi.length - 1].to * fps) : durationInFrames;
  // Konuşma sahnelerinde ve seslendirme süresince müziği kıs (ducking); sonda 1 sn içinde sön.
  const araliklar: { a: number; b: number; konusma: boolean }[] = [];
  let bas = 0;
  for (const s of plan.sahneler) {
    araliklar.push({ a: bas * fps, b: (bas + s.sure) * fps, konusma: (s.ses ?? s.tip === "konusma") === true });
    bas += s.sure;
  }
  return (
    <Audio
      src={dosya(plan.klasor, m.src)}
      loop
      volume={(f) => {
        const r = araliklar.find((x) => f >= x.a && f < x.b);
        const seslendirmeVar = plan.seslendirme && f >= plan.seslendirme.from * fps && f < sesSonu;
        const hedef = r?.konusma || seslendirmeVar ? m.konusmadaSes : m.ses;
        const sonus = interpolate(f, [durationInFrames - fps, durationInFrames - 1], [1, 0], clamp);
        return hedef * sonus;
      }}
    />
  );
};

// ───────────────────────── kompozisyon ─────────────────────────

export const IlanReel: React.FC<IlanPlan> = (plan) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const icerikSonu = toplamSure(plan) - plan.kapanis.sure;
  let bas = 0;
  const etiketler = plan.sahneler.map((s) => {
    const r = { from: bas, s };
    bas += s.sure;
    return r;
  });
  return (
    <AbsoluteFill style={{ backgroundColor: renk.cbMaviKoyu }}>
      <SahneKatmani plan={plan} />
      {/* Okunabilirlik: üstte lacivert, altta koyu degrade (mülkü örtmeden). */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,15,51,0.72) 0%, rgba(0,15,51,0.35) 30%, rgba(0,15,51,0) 45%, rgba(0,0,0,0) 55%, rgba(0,10,30,0.55) 78%, rgba(0,10,30,0.7) 100%)",
        }}
      />
      <GecisOrtusu plan={plan} />
      {etiketler.map(({ from, s }, i) =>
        s.etiket ? (
          <Sequence key={i} from={Math.round(from * fps)} durationInFrames={Math.round(s.sure * fps)} layout="none">
            <OdaEtiketi metin={s.etiket} frames={Math.round(s.sure * fps)} />
          </Sequence>
        ) : null,
      )}
      <UstBant plan={plan} t={t} bitis={icerikSonu} />
      <BaslikKarti plan={plan} t={t} />
      <BilgiCubugu plan={plan} t={t} />
      <Altyazi plan={plan} t={t} />
      <Sequence from={Math.round(icerikSonu * fps)} durationInFrames={Math.round(plan.kapanis.sure * fps)}>
        <Kapanis plan={plan} />
      </Sequence>
      <Muzik plan={plan} />
      {plan.seslendirme ? (
        <Sequence from={Math.round(plan.seslendirme.from * fps)} layout="none">
          <Audio src={dosya(plan.klasor, plan.seslendirme.src)} volume={() => plan.seslendirme?.ses ?? 1} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
