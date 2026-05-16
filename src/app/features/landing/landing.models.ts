import { PublicTournamentMatch } from "../../core/services/tournaments.service";
import { ParticipationFormValue } from "../../shared/components/participation-form-tabs.component";

export type ContactReason = "participation" | "sponsor";

export type LandingGame = {
  name: string;
  description: string;
  details: string;
  image: string;
  format: string;
  audience: string;
  highlights: string[];
  rules?: string[];
};

export type SponsorTier = {
  name: string;
  color: string;
  description: string;
  perks: string[];
};

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export type PublicMatchGroup = {
  tournamentName: string;
  matches: PublicTournamentMatch[];
};

export type LandingParticipationForm = ParticipationFormValue & {
  reason: ContactReason;
};

export type LandingSectionTarget = "top" | "sport" | "sponsor" | "partecipa";

export type LandingSectionNavigation = {
  event: MouseEvent;
  sectionId: LandingSectionTarget;
};
