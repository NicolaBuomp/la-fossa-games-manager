import { SponsorStatus } from "./models";

export const EXPENSE_CATEGORIES = [
  "Attrezzatura",
  "Premi/Trofei",
  "Catering",
  "Affitto campi/sale",
  "Marketing",
  "Arbitri/Staff",
  "Assicurazione",
  "Trasporti",
  "Materiale promo",
  "Altro",
];

export const INCOME_CATEGORIES = [
  "Iscrizioni",
  "Sponsor",
  "Bar/Ristoro",
  "Merchandising",
  "Biglietti",
  "Donazioni",
  "Altro",
];

export const PAYMENT_METHODS = [
  "Contanti",
  "Bonifico",
  "POS/Carta",
  "PayPal",
  "Altro",
];

export const SPONSOR_STATUSES: Array<{
  id: SponsorStatus;
  label: string;
  className: string;
}> = [
  { id: "contattato", label: "Contattato", className: "state-neutral" },
  { id: "in_trattativa", label: "In trattativa", className: "state-warning" },
  { id: "confermato", label: "Confermato", className: "state-info" },
  { id: "pagato", label: "Pagato", className: "state-success" },
];
