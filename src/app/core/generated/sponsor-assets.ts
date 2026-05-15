export type SponsorCategory = 'gold' | 'silver' | 'bronzo';

export type SponsorAsset = {
  name: string;
  src: string;
  category: SponsorCategory;
};

export const SPONSOR_ASSETS: SponsorAsset[] = [
  {
    "name": "VETERFARM",
    "src": "/assets/sponsor/main/VETERFARM_LOGO_PREMIUM.png",
    "category": "gold"
  },
  {
    "name": "Regno Regno Dei Mazzoni",
    "src": "/assets/sponsor/base/regno_regno_dei_mazzoni.jpeg",
    "category": "bronzo"
  }
];
