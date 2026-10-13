// server/src/models/PopupSurvey.ts
// 30-second QR survey collected at offline pop-up booths (e.g. FPT Plaza).
import mongoose, { Schema, Document } from 'mongoose';

export const SURVEY_CAMPAIGNS = ['fpt_plaza_popup'] as const;
export const SURVEY_MOTIVATIONS = ['save_money', 'declutter', 'new_items'] as const;
export const SURVEY_REFERRAL_INTENTS = ['willing', 'try_first'] as const;

export type SurveyCampaign = (typeof SURVEY_CAMPAIGNS)[number];
export type SurveyMotivation = (typeof SURVEY_MOTIVATIONS)[number];
export type SurveyReferralIntent = (typeof SURVEY_REFERRAL_INTENTS)[number];

export interface IPopupSurvey extends Document {
  campaign: SurveyCampaign;
  phone: string;
  /** Q1 — Has used kids' toys/clothes to declutter */
  hasItemsToDeclutter?: boolean;
  /** Q2 — Main expectation when swapping */
  motivation?: SurveyMotivation;
  /** Q3 — Worried about haggling/scams on Facebook */
  fearsFacebookScams?: boolean;
  /** Q4 — Finds a nearby 0đ Xu swap app useful */
  findsAppUseful?: boolean;
  /** Q5 — Willing to refer other moms in the building */
  referralIntent?: SurveyReferralIntent;
  rewardCode: string;
  starterXu: number;
  /** First N respondents get Safe Fee waived on their first 3 posts */
  safeFeeWaiver: boolean;
  orderNumber: number;
  ip?: string;
  consentAt: Date;
  consentVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const PopupSurveySchema = new Schema<IPopupSurvey>(
  {
    campaign: { type: String, enum: SURVEY_CAMPAIGNS, required: true, index: true },
    phone: { type: String, required: true, trim: true },
    hasItemsToDeclutter: { type: Boolean, required: false },
    motivation: { type: String, enum: SURVEY_MOTIVATIONS, required: false },
    fearsFacebookScams: { type: Boolean, required: false },
    findsAppUseful: { type: Boolean, required: false },
    referralIntent: { type: String, enum: SURVEY_REFERRAL_INTENTS, required: false },
    rewardCode: { type: String, required: true, unique: true },
    starterXu: { type: Number, required: true, default: 5 },
    safeFeeWaiver: { type: Boolean, default: false },
    orderNumber: { type: Number, required: true },
    ip: { type: String, default: '' },
    consentAt: { type: Date, default: Date.now },
    consentVersion: { type: String, default: '2026-10' },
  },
  { timestamps: true }
);

// One survey per phone per campaign
PopupSurveySchema.index({ campaign: 1, phone: 1 }, { unique: true });
PopupSurveySchema.index({ campaign: 1, orderNumber: 1 }, { unique: true });

export const PopupSurvey =
  mongoose.models.PopupSurvey || mongoose.model<IPopupSurvey>('PopupSurvey', PopupSurveySchema);
