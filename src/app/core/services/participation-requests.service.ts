import { Injectable } from "@angular/core";
import {
  InsertTeamParticipant,
  InsertTournamentTeam,
  ParticipationRequest,
  ParticipationRequestWithTournament,
} from "../types/models";
import { SupabaseService } from "./supabase.service";

type RequestStatus = ParticipationRequest["status"];
type TransferParticipant = Pick<
  InsertTeamParticipant,
  "first_name" | "last_name" | "contact" | "gender" | "registered"
>;

export interface ParticipationRequestTransferPayload {
  team_name: string;
  captain_name: string | null;
  captain_contact: string | null;
  vice_captain_name: string | null;
  vice_captain_contact: string | null;
  paid: boolean;
  notes: string | null;
  participants: TransferParticipant[];
}

@Injectable({ providedIn: "root" })
export class ParticipationRequestsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(): Promise<ParticipationRequestWithTournament[]> {
    const { data, error } = await this.supabase.client
      .from("participation_requests")
      .select(
        "*, tournaments(name, code, sport, fee), participation_request_notes(*, profiles(full_name, email))",
      )
      .neq("status", "trasferita")
      .order("created_at", { ascending: false });

    if (!error) {
      return this.mapRequests(data);
    }

    // Staff may not have access to related profiles; fallback keeps requests visible.
    const fallback = await this.supabase.client
      .from("participation_requests")
      .select("*, tournaments(name, code, sport, fee), participation_request_notes(*)")
      .neq("status", "trasferita")
      .order("created_at", { ascending: false });

    if (!fallback.error) {
      return this.mapRequests(fallback.data);
    }

    // Last fallback: if notes are blocked by RLS, keep the base requests visible.
    const baseOnly = await this.supabase.client
      .from("participation_requests")
      .select("*, tournaments(name, code, sport, fee)")
      .neq("status", "trasferita")
      .order("created_at", { ascending: false });

    if (baseOnly.error) throw error;
    const rows = (baseOnly.data ??
      []) as Array<ParticipationRequestWithTournament>;

    return rows.map((request) => ({
      ...request,
      participation_request_notes: [],
    }));
  }

  async pendingCount(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from("participation_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "nuova");
    if (error) throw error;
    return count ?? 0;
  }

  async updateStatus(id: string, status: RequestStatus): Promise<void> {
    const { error } = await this.supabase.client
      .from("participation_requests")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  }

  async transferToTournament(
    request: ParticipationRequestWithTournament,
    payload: ParticipationRequestTransferPayload,
  ): Promise<void> {
    let createdTeamId: string | null = null;
    let completed = false;
    const teamPayload: InsertTournamentTeam = {
      tournament_id: request.tournament_id,
      name: payload.team_name,
      captain_name: payload.captain_name,
      captain_contact: payload.captain_contact,
      vice_captain_name: payload.vice_captain_name,
      vice_captain_contact: payload.vice_captain_contact,
      fee: Number(request.tournaments?.fee || 0),
      paid: payload.paid,
      notes: payload.notes,
    };

    try {
      const { data: team, error: teamError } = await this.supabase.client
        .from("tournament_teams")
        .insert(teamPayload)
        .select("id")
        .single();
      if (teamError) throw teamError;
      createdTeamId = team.id;

      if (payload.participants.length) {
        const { error: participantsError } = await this.supabase.client
          .from("team_participants")
          .insert(
            payload.participants.map((participant) => ({
              ...participant,
              team_id: createdTeamId,
            })),
          );
        if (participantsError) throw participantsError;
      }

      await this.updateStatus(request.id, "trasferita");
      completed = true;
    } finally {
      if (createdTeamId && !completed) {
        await this.supabase.client
          .from("tournament_teams")
          .delete()
          .eq("id", createdTeamId);
      }
    }
  }

  async addNote(requestId: string, note: string): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await this.supabase.client.auth.getUser();
    if (userError) throw userError;

    const { error } = await this.supabase.client
      .from("participation_request_notes")
      .insert({ request_id: requestId, note, created_by: user?.id ?? null });
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from("participation_requests")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  private mapRequests(data: unknown): ParticipationRequestWithTournament[] {
    return ((data ?? []) as ParticipationRequestWithTournament[]).map(
      (request) => ({
        ...request,
        participation_request_notes: [
          ...(request.participation_request_notes ?? []),
        ].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      }),
    );
  }
}
