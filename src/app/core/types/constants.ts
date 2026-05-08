import { SponsorStatus } from './models';

export const EXPENSE_CATEGORIES = [
  'Attrezzatura',
  'Premi/Trofei',
  'Catering',
  'Affitto campi/sale',
  'Marketing',
  'Arbitri/Staff',
  'Assicurazione',
  'Trasporti',
  'Materiale promo',
  'Altro'
];

export const INCOME_CATEGORIES = [
  'Iscrizioni',
  'Sponsor',
  'Bar/Ristoro',
  'Merchandising',
  'Biglietti',
  'Donazioni',
  'Altro'
];

export const PAYMENT_METHODS = ['Contanti', 'Bonifico', 'POS/Carta', 'PayPal', 'Altro'];

export const SPONSOR_STATUSES: Array<{ id: SponsorStatus; label: string; className: string }> = [
  { id: 'contattato', label: 'Contattato', className: 'border-neutral-300 bg-neutral-100 text-neutral-700' },
  { id: 'in_trattativa', label: 'In trattativa', className: 'border-amber-200 bg-amber-100 text-amber-800' },
  { id: 'confermato', label: 'Confermato', className: 'border-blue-200 bg-blue-100 text-blue-800' },
  { id: 'pagato', label: 'Pagato', className: 'border-emerald-200 bg-emerald-100 text-emerald-800' }
];
