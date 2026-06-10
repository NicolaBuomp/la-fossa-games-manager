import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { InsertParticipationRequest, PublicTournament } from '../types/models';

// Tabelle/viste del database del nuovo gestionale (la-fossa-events-management):
// le richieste della landing vengono inoltrate li', non piu' al DB locale.
const MANAGEMENT = {
  ContactRequests: 'contact_requests',
  PublicActiveEvent: 'v_public_active_event',
  PublicOpenTournaments: 'v_public_open_tournaments',
} as const;

const REQUEST_SOURCE_LANDING = 'landing_page';

export interface PublicSponsorLead {
  company_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  privacy_accepted: boolean;
  whatsapp_accepted: boolean;
}

interface PublicOpenTournamentRow {
  id: string;
  event_id: string;
  name: string;
  entry_fee: number | null;
}

@Injectable({ providedIn: 'root' })
export class PublicParticipationService {
  /** event_id (nel nuovo gestionale) dei tornei elencati nel form. */
  private readonly tournamentEventIds = new Map<string, string>();
  private activeEventId: string | null = null;

  constructor(private readonly supabase: SupabaseService) {}

  private get client() {
    return this.supabase.managementClient;
  }

  async listAvailableTournaments(): Promise<PublicTournament[]> {
    const { data, error } = await this.client
      .from(MANAGEMENT.PublicOpenTournaments)
      .select('id, event_id, name, entry_fee')
      .order('name', { ascending: true });

    if (error) throw error;
    const rows = (data ?? []) as PublicOpenTournamentRow[];

    this.tournamentEventIds.clear();
    for (const row of rows) {
      this.tournamentEventIds.set(row.id, row.event_id);
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: null,
      fee: Number(row.entry_fee || 0),
    }));
  }

  async createRequest(payload: InsertParticipationRequest): Promise<void> {
    const eventId =
      this.tournamentEventIds.get(payload.tournament_id) ??
      (await this.getActiveEventId());

    const { error } = await this.client
      .from(MANAGEMENT.ContactRequests)
      .insert({
        event_id: eventId,
        tournament_id: payload.tournament_id,
        request_type: 'tournament',
        source: REQUEST_SOURCE_LANDING,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        privacy_accepted: payload.privacy_accepted,
        whatsapp_accepted: payload.whatsapp_accepted,
        rules_accepted: payload.rules_accepted,
      });
    if (error) throw error;
  }

  async createSponsorLead(lead: PublicSponsorLead): Promise<void> {
    const { error } = await this.client
      .from(MANAGEMENT.ContactRequests)
      .insert({
        event_id: await this.getActiveEventId(),
        request_type: 'sponsor',
        source: REQUEST_SOURCE_LANDING,
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,
        privacy_accepted: lead.privacy_accepted,
        whatsapp_accepted: lead.whatsapp_accepted,
        notes: `Azienda: ${lead.company_name}. Lead sponsor generato dal form pubblico. Ricontattare via WhatsApp.`,
      });
    if (error) throw error;
  }

  private async getActiveEventId(): Promise<string> {
    if (this.activeEventId) {
      return this.activeEventId;
    }

    const { data, error } = await this.client
      .from(MANAGEMENT.PublicActiveEvent)
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error(
        'Nessun evento attivo disponibile per ricevere la richiesta.',
      );
    }

    this.activeEventId = data.id;
    return data.id;
  }
}
