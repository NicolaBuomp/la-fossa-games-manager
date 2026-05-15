export type SponsorCategory = 'gold' | 'silver' | 'bronzo';

export type SponsorAsset = {
  name: string;
  src: string;
  category: SponsorCategory;
};

export const SPONSOR_ASSETS: SponsorAsset[] = [
  {
    "name": "VETERFARM LOGO PREMIUM",
    "src": "/assets/sponsor/gold/VETERFARM_LOGO_PREMIUM.png",
    "category": "gold"
  },
  {
    "name": "SALVATORE CEPPARULO LOGO BASE",
    "src": "/assets/sponsor/bronzo/SALVATORE_CEPPARULO_LOGO_BASE.png",
    "category": "bronzo"
  }
];
