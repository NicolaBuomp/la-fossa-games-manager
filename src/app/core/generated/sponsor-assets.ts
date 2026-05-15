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
    "name": "SALVATORE CEPPARULO",
    "src": "/assets/sponsor/base/SALVATORE_CEPPARULO_LOGO_BASE.png",
    "category": "bronzo"
  }
];
