// Dikey ilan videolarının giriş noktası: yalnızca IlanReel kompozisyonunu kaydeder.
// Eski 16:9 hattından (src/index.ts, work/edit-plan.json, Inter fontu) bağımsızdır.
// Kullanım: npm run ilan:studio | ilan:still | ilan:render  (plan: work/ilan-plan.json)
import { registerRoot } from "remotion";
import { IlanRoot } from "./IlanRoot";

registerRoot(IlanRoot);
