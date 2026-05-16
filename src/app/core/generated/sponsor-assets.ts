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
    "src": "/assets/sponsor/medium/regno_regno_dei_mazzoni.jpeg",
    "category": "silver"
  },
  {
    "name": "Bellanca",
    "src": "/assets/sponsor/base/bellanca.jpeg",
    "category": "bronzo"
  },
  {
    "name": "Gazzillo",
    "src": "/assets/sponsor/base/gazzillo.jpeg",
    "category": "bronzo"
  },
  {
    "name": "Lacasertana",
    "src": "/assets/sponsor/base/lacasertana.jpg",
    "category": "bronzo"
  },
  {
    "name": "SALVATORE CEPPARULO",
    "src": "/assets/sponsor/base/SALVATORE_CEPPARULO_LOGO_BASE.png",
    "category": "bronzo"
  },
  {
    "name": "Zootecnica Bufalina",
    "src": "/assets/sponsor/base/zootecnica_bufalina.jpeg",
    "category": "bronzo"
  }
];
