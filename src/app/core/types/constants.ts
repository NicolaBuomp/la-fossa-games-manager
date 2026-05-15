import { ExpenseStatus, SponsorCategory, SponsorStatus } from "./models";

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

export const EXPENSE_STATUSES: Array<{
  id: ExpenseStatus;
  label: string;
  className: string;
}> = [
  { id: "pagata", label: "Pagata", className: "state-success" },
  {
    id: "da_rimborsare",
    label: "Da rimborsare",
    className: "state-warning",
  },
  { id: "rimborsata", label: "Rimborsata", className: "state-info" },
];

export const SPONSOR_CATEGORIES: Array<{
  id: SponsorCategory;
  label: string;
}> = [
  { id: "bronzo", label: "Bronzo" },
  { id: "silver", label: "Silver" },
  { id: "gold", label: "Gold" },
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
