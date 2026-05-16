import { LandingGame, SponsorTier } from "./landing.models";

export const LANDING_GAMES: LandingGame[] = [
  {
    name: "Calcio a 5",
    description: "Squadre, gironi e partite ad alta intensità.",
    details: "Il classico torneo di quartiere, ritmo alto e grande tifo.",
    image: "/assets/icone/icona-calcio.svg",
    format: "A squadre",
    audience: "Open",
    highlights: [
      "Partite veloci e calendario concentrato.",
      "Gironi iniziali e fase a eliminazione.",
      "Premiazione finale.",
    ],
    rules: [
      "Squadre composte da massimo 8 giocatori.",
      "Formula con gironi iniziali e fase a eliminazione diretta. In caso di pareggio nelle fasi finali si procede ai rigori.",
      "In caso di parità in classifica valgono, nell'ordine: scontri diretti, differenza reti, gol fatti e sorteggio.",
      "Si applicano le regole ufficiali del calcio a 5.",
      "Ritardo massimo consentito: 10 minuti. Oltre il limite, sconfitta 6-0 a tavolino.",
      "Rispetto obbligatorio per arbitri, avversari e organizzazione. Bestemmie, risse o comportamenti antisportivi possono portare ad ammonizione, espulsione o esclusione.",
      "Quota: 80 euro per squadra, più 10 euro a partita per squadra.",
      "Iscrizioni aperte fino al 19 giugno.",
      "I capitani saranno inseriti in un gruppo WhatsApp dedicato con regolamento ufficiale e comunicazioni organizzative.",
    ],
  },
  {
    name: "Calcio a 5 under 15",
    description:
      "Il torneo dedicato ai più giovani, con spirito di squadra e fair play.",
    details: "Spazio ai più piccoli con partite pensate per età e sicurezza.",
    image: "/assets/icone/icona-calcio.svg",
    format: "A squadre",
    audience: "Under 15",
    highlights: [
      "Gironi bilanciati per categoria.",
      "Focus su fair play e partecipazione.",
      "Finale con premiazione dedicata.",
    ],
  },
  {
    name: "Green Volley",
    description: "Torneo 3 vs 3 su campo in erba sintetica.",
    image: "/assets/icone/icona-pallavolo.svg",
    details:
      "Area Mercato, Santa Maria la Fossa. Iscrizioni aperte fino al 19 giugno.",
    format: "3 vs 3",
    audience: "Open",
    highlights: [
      "Squadre da 3 giocatori, con massimo 5 giocatori in rosa.",
      "Massimo 1 tesserato FIPAV per squadra.",
      "Quota iscrizione: 50 euro a squadra.",
      "Campo in erba sintetica.",
      "I capitani saranno aggiunti a un gruppo WhatsApp con regolamento ufficiale e comunicazioni.",
    ],
    rules: [
      "Formula con gironi più fase a eliminazione diretta.",
      "Partite al meglio dei 3 set: primi due set ai 21 punti, eventuale terzo set ai 15.",
      "Classifica gironi: vittoria 3 punti, sconfitta 0 punti.",
      "In caso di parità valgono, nell'ordine: scontri diretti, differenza set, differenza punti e sorteggio.",
      "Si applicano le regole ufficiali del green volley.",
      "Cambi illimitati, battuta libera anche dall'alto e rotazione obbligatoria.",
      "Punto per l'avversario in caso di tocco di rete, tocco della linea in battuta o più di 3 tocchi escluso il muro.",
      "Ritardo massimo consentito: 10 minuti. Oltre il limite, partita persa a tavolino.",
      "Rispetto obbligatorio per arbitri, avversari e organizzazione. Bestemmie, risse o atti antisportivi possono portare ad ammonizione, espulsione o esclusione.",
      "Info e iscrizioni in DM o al 335 5653748, Gaetano.",
    ],
  },
  {
    name: "Calcio balilla",
    description: "Coppie, riflessi e sfide punto su punto.",
    image: "/assets/icone/icona-calcio-balilla.svg",
    details:
      "Sfide a coppie dove coordinazione e velocità fanno la differenza.",
    format: "A coppie",
    audience: "Open",
    highlights: [
      "Tabellone ad eliminazione diretta.",
      "Partite rapide e spettacolari.",
      "Finalissima davanti al pubblico.",
    ],
  },
  {
    name: "Briscola",
    description:
      "Torneo a coppie con gironi, fasi finali e partite a 120 punti.",
    image: "/assets/icone/icona-briscola.svg",
    details:
      "Sfide al meglio delle partite, classifica a punti e regolamento dedicato per gestire spareggi e parità.",
    format: "A coppie",
    audience: "Open",
    highlights: [
      "Fase a gironi al meglio delle 3 partite.",
      "Fasi finali al meglio delle 5 partite.",
      "Quota iscrizione: 20 euro a squadra.",
      "Iscrizioni aperte fino al 19 giugno.",
      "Gruppo WhatsApp per capitani con regolamento ufficiale e comunicazioni.",
    ],
    rules: [
      "Fase a gironi: sfide al meglio delle 3 partite a 120 punti.",
      "In caso di 1-1 nei gironi si gioca uno spareggio secco a 120 punti.",
      "In caso di parità nel singolo scontro dei gironi, ad esempio 70-50 e 50-70, si gioca una minipartita a 60 punti.",
      "Ogni vittoria nella fase a gironi vale 3 punti.",
      "A parità di punti in classifica conta la differenza tra 120 vinti e 120 persi. Se la parità persiste, si gioca una partita di spareggio con le stesse modalità.",
      "Fasi finali: sfide al meglio delle 5 partite a 120 punti.",
      "In caso di 2-2 nelle fasi finali si gioca uno spareggio secco a 120 punti.",
      "In caso di parità nel singolo scontro delle fasi finali si gioca una nuova partita a 120 punti.",
      "Durante tutta la partita è consentito parlare con il proprio compagno.",
      "È vietato rivedere il mazzetto delle carte già giocate.",
      "Se un giocatore sbaglia a giocare una carta, la mano può essere ripetuta solo con il consenso degli avversari. La scelta vale per tutta la partita e si applica a entrambe le coppie.",
      "Ritardo massimo consentito: 15 minuti. Oltre il limite, partita persa a tavolino.",
      "Gironi, calendario, accoppiamenti e tabellone saranno comunicati prima dell'inizio del torneo.",
      "Info e iscrizioni in DM, su lafossagames.com o al 351 5578081, Gianmarco.",
    ],
  },
  {
    name: "FIFA 26",
    description:
      "Console, controller e partite da vivere fino all'ultimo gol.",
    image: "/assets/icone/icona-fc26.svg",
    details: "Torneo eSports in presenza con partite uno contro uno.",
    format: "Singolo",
    audience: "Open",
    highlights: [
      "Bracket competitivo ad eliminazione.",
      "Setup ufficiale e regole condivise.",
      "Finale live con pubblico.",
    ],
  },
  {
    name: "Ping pong",
    description: "Scambi rapidi, ritmo alto e concentrazione.",
    image: "/assets/icone/icona-pingpong.svg",
    details: "Velocità, tecnica e riflessi in un torneo individuale.",
    format: "Singolo",
    audience: "Open",
    highlights: [
      "Partite a set con tabellone progressivo.",
      "Sfide ravvicinate e tempi rapidi.",
      "Finale con premiazione sul palco.",
    ],
  },
];

export const SPONSOR_TIERS: SponsorTier[] = [
  {
    name: "Gold",
    color: "#ffd400",
    description:
      "La presenza più completa per massima riconoscibilità prima e durante l'evento.",
    perks: [
      "Logo su cartellone dedicato",
      "Visibilità sui social e sito web",
      "Premiazioni e menzioni durante l'evento",
      "Attività promozionali",
    ],
  },
  {
    name: "Silver",
    color: "#c8c8c8",
    description:
      "Una soluzione intermedia per essere presenti sui materiali principali dell'evento.",
    perks: [
      "Logo su cartellone dedicato 2x1",
      "Visibilità sui social e sito web",
      "Menzioni durante l'evento",
    ],
  },
  {
    name: "Bronzo",
    color: "#d98945",
    description:
      "La formula essenziale per sostenere l'iniziativa e comparire nella comunicazione sponsor.",
    perks: [
      "Logo su cartellone insieme agli altri sponsor",
      "Visibilità sui social",
      "Menzioni durante l'evento",
    ],
  },
];
