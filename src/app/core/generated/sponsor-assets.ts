export type SponsorCategory = 'platino' | 'oro' | 'argento' | 'bronzo';

export type SponsorAsset = {
  name: string;
  src: string;
  category: SponsorCategory;
};

export const SPONSOR_ASSETS: SponsorAsset[] = [
  {
    "name": "VETERFARM",
    "src": "/assets/sponsor/platino/VETERFARM_LOGO_PREMIUM.png",
    "category": "platino"
  },
  {
    "name": "Regno Dei Mazzoni",
    "src": "/assets/sponsor/argento/regno_dei_mazzoni.jpeg",
    "category": "argento"
  },
  {
    "name": "Autofficina Gazzillo",
    "src": "/assets/sponsor/bronzo/autofficina gazzillo.jpeg",
    "category": "bronzo"
  },
  {
    "name": "Azienda Zootecnica Bufalina Della Vecchia",
    "src": "/assets/sponsor/bronzo/Azienda Zootecnica Bufalina Della Vecchia.jpeg",
    "category": "bronzo"
  },
  {
    "name": "Bellanca",
    "src": "/assets/sponsor/bronzo/bellanca.jpeg",
    "category": "bronzo"
  },
  {
    "name": "Centro Shopping Zio Teofilo",
    "src": "/assets/sponsor/bronzo/centro shopping zio teofilo.jpeg",
    "category": "bronzo"
  },
  {
    "name": "Gs Autofficina",
    "src": "/assets/sponsor/bronzo/Gs Autofficina.jpg",
    "category": "bronzo"
  },
  {
    "name": "La Casertana",
    "src": "/assets/sponsor/bronzo/La Casertana.jpg",
    "category": "bronzo"
  },
  {
    "name": "Onoranze Funebri Palazzo",
    "src": "/assets/sponsor/bronzo/onoranze funebri palazzo.jpeg",
    "category": "bronzo"
  },
  {
    "name": "Soccer Royal Betting Di Salvatore Cepparulo",
    "src": "/assets/sponsor/bronzo/Soccer Royal Betting di Salvatore Cepparulo.png",
    "category": "bronzo"
  },
  {
    "name": "Tabacchi N1",
    "src": "/assets/sponsor/bronzo/tabacchi n1.jpeg",
    "category": "bronzo"
  },
  {
    "name": "ZIO TEOFILO BAR TABACCHI",
    "src": "/assets/sponsor/bronzo/ZIO TEOFILO - BAR - TABACCHI.jpg",
    "category": "bronzo"
  }
];
