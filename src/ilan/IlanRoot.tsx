import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { IlanReel } from "./IlanReel";
import { IlanPlan, ilanPlanSchema, toplamSure } from "./sema";
import ornekIlan from "../../library/examples/ilan-plan.example.json";

// Plan --props=work/ilan-plan.json ile verilir; burada doğrulanır ve süre ondan hesaplanır.
const ilanMetadata: CalculateMetadataFunction<IlanPlan> = ({ props }) => {
  const plan = ilanPlanSchema.parse(props);
  return { props: plan, fps: plan.fps, durationInFrames: Math.round(toplamSure(plan) * plan.fps) };
};
const ilanDefaults: IlanPlan = ilanPlanSchema.parse(ornekIlan);

export const IlanRoot: React.FC = () => (
  // 1080×1920, H.264 SDR — Instagram Reels/Story, TikTok, WhatsApp Durum (references/dikey-format.md)
  <Composition id="IlanReel" component={IlanReel} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={ilanDefaults} calculateMetadata={ilanMetadata} />
);
