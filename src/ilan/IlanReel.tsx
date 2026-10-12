// İLAN REELS — dikey 1080×1920 emlak tanıtım videosu (Instagram Reels/Story, TikTok, WhatsApp Durum).
// Danışmanın konuşma çekimleri ile mülk video/fotoğrafları art arda; üstünde Coldwell Banker kimliğiyle
// ilan etiketi + logo, başlık kartı, bilgi çubuğu, oda etiketleri, altyazı; sonda danışman kapanış kartı.
// Tüm içerik `IlanPlan` verisinden gelir (src/ilan/sema.ts); bu dosyada ilana özgü metin yoktur.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio, Video } from "@remotion/media";
import { IlanPlan, Sahne, toplamSure } from "./sema";
import { guvenli as G, renk, yazi } from "./tema";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const yumusak = Easing.bezier(0.16, 1, 0.3, 1);
const tr = (s: string) => s.toLocaleUpperCase("tr-TR");

/** 0→1 giriş, 1→0 çıkış; saniye cinsinden pencere. */
const pencere = (t: number, from: number, to: number, giris = 0.45, cikis = 0.35) =>
  Math.min(
    interpolate(t, [from, from + giris], [0, 1], { ...clamp, easing: yumusak }),
    interpolate(t, [to - cikis, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) }),
  );

// ───────────────────────── arka plan: sahneler ─────────────────────────

const SahneGorsel: React.FC<{ s: Sahne; frames: number }> = ({ s, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = frames > 1 ? frame / (frames - 1) : 0;
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
  if (foto) return <Img src={staticFile(s.src)} style={stil} />;
  const sesAcik = s.ses ?? s.tip === "konusma";
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Video src={staticFile(s.src)} trimBefore={Math.round(s.baslangic * fps)} muted={!sesAcik} objectFit="cover" style={stil} />
    </AbsoluteFill>
  );
};

/** Sahne geçişi: her sahne ilk 6 karede beyaza yakın bir parlamadan değil, kısa bir opaklık girişiyle gelir. */
const SahneKatmani: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const { fps } = useVideoConfig();
  let bas = 0;
  return (
    <>
      {plan.sahneler.map((s, i) => {
        const from = Math.round(bas * fps);
        const frames = Math.round(s.sure * fps);
        bas += s.sure;
        return (
          <Sequence key={i} from={from} durationInFrames={frames} premountFor={fps}>
            <GirisOpak ilk={i === 0}>
              <SahneGorsel s={s} frames={frames} />
            </GirisOpak>
          </Sequence>
        );
      })}
    </>
  );
};

const GirisOpak: React.FC<{ ilk: boolean; children: React.ReactNode }> = ({ ilk, children }) => {
  const frame = useCurrentFrame();
  const o = ilk ? 1 : interpolate(frame, [0, 6], [0.35, 1], clamp);
  return <AbsoluteFill style={{ opacity: o, backgroundColor: renk.cbMaviKoyu }}>{children}</AbsoluteFill>;
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
  // Konuşma sahnelerinde müziği kıs (ducking), mülk sahnelerinde aç; sonda 1 sn içinde sön.
  const araliklar: { a: number; b: number; konusma: boolean }[] = [];
  let bas = 0;
  for (const s of plan.sahneler) {
    araliklar.push({ a: bas * fps, b: (bas + s.sure) * fps, konusma: (s.ses ?? s.tip === "konusma") === true });
    bas += s.sure;
  }
  return (
    <Audio
      src={staticFile(m.src)}
      loop
      volume={(f) => {
        const r = araliklar.find((x) => f >= x.a && f < x.b);
        const hedef = r?.konusma ? m.konusmadaSes : m.ses;
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
    </AbsoluteFill>
  );
};
