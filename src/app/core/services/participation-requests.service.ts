import { Injectable } from "@angular/core";
import {
  InsertTeamParticipant,
  InsertTournamentTeam,
  PagedResult,
  ParticipationRequest,
  ParticipationRequestWithTournament,
  RequestStatusCounts,
} from "../types/models";
import {
  FILTER_ALL,
  PAGE_SIZE,
  PARTICIPATION_REQUEST_STATUS,
  SUPABASE_RPC,
  SUPABASE_TABLE,
} from "../types/constants";
import { SupabaseService } from "./supabase.service";

type RequestStatus = ParticipationRequest["status"];
type TransferParticipant = Pick<
  InsertTeamParticipant,
  "first_name" | "last_name" | "contact" | "registered"
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

export interface RequestListParams {
  search?: string;
  status?: RequestStatus | typeof FILTER_ALL;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: "root" })
export class ParticipationRequestsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(params: RequestListParams = {}): Promise<PagedResult<ParticipationRequestWithTournament>> {
    const { page = 1, pageSize = PAGE_SIZE, search, status } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (q: any) => {
      let filtered = q.neq("status", PARTICIPATION_REQUEST_STATUS.Transferred);
      if (status && status !== FILTER_ALL) {
        filtered = filtered.eq("status", status);
      }
      if (search) {
        filtered = filtered.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
        );
      }
      return filtered.order("created_at", { ascending: false }).range(from, to);
    };

    const { data, error, count } = await applyFilters(
      this.supabase.client
        .from(SUPABASE_TABLE.ParticipationRequests)
        .select(
          "*, tournaments(name, code, fee), participation_request_notes(*, profiles(full_name, email))",
          { count: "exact" },
        ),
    );

    if (!error) {
      return { data: this.mapRequests(data), total: count ?? 0 };
    }

    // Staff may not have access to related profiles; fallback keeps requests visible.
    const fallback = await applyFilters(
      this.supabase.client
        .from(SUPABASE_TABLE.ParticipationRequests)
        .select(
          "*, tournaments(name, code, fee), participation_request_notes(*)",
          { count: "exact" },
        ),
    );

    if (!fallback.error) {
      return { data: this.mapRequests(fallback.data), total: fallback.count ?? 0 };
    }

    // Last fallback: if notes are blocked by RLS, keep base requests visible.
    const baseOnly = await applyFilters(
      this.supabase.client
        .from(SUPABASE_TABLE.ParticipationRequests)
        .select("*, tournaments(name, code, fee)", { count: "exact" }),
    );

    if (baseOnly.error) throw error;
    const rows = (baseOnly.data ?? []) as ParticipationRequestWithTournament[];
    return {
      data: rows.map((request) => ({ ...request, participation_request_notes: [] })),
      total: baseOnly.count ?? 0,
    };
  }

  async countsByStatus(): Promise<RequestStatusCounts> {
    const { data, error } = await this.supabase.client.rpc(
      SUPABASE_RPC.GetParticipationRequestCounts,
    );
    if (error) throw error;
    const r = data as Record<string, unknown> | null;
    return {
      newCount:       Number(r?.['newCount'] ?? 0),
      managingCount:  Number(r?.['managingCount'] ?? 0),
      contactedCount: Number(r?.['contactedCount'] ?? 0),
      archivedCount:  Number(r?.['archivedCount'] ?? 0),
    };
  }

  async pendingCount(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from(SUPABASE_TABLE.ParticipationRequests)
      .select("id", { count: "exact", head: true })
      .eq("status", PARTICIPATION_REQUEST_STATUS.New);
    if (error) throw error;
    return count ?? 0;
  }

  async updateStatus(id: string, status: RequestStatus): Promise<void> {
    const { error } = await this.supabase.client
      .from(SUPABASE_TABLE.ParticipationRequests)
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
        .from(SUPABASE_TABLE.TournamentTeams)
        .insert(teamPayload)
        .select("id")
        .single();
      if (teamError) throw teamError;
      createdTeamId = team.id;

      if (payload.participants.length) {
        const { error: participantsError } = await this.supabase.client
          .from(SUPABASE_TABLE.TeamParticipants)
          .insert(
            payload.participants.map((participant) => ({
              ...participant,
              team_id: createdTeamId,
            })),
          );
        if (participantsError) throw participantsError;
      }

      await this.updateStatus(request.id, PARTICIPATION_REQUEST_STATUS.Transferred);
      completed = true;
    } finally {
      if (createdTeamId && !completed) {
        await this.supabase.client
          .from(SUPABASE_TABLE.TournamentTeams)
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
      .from(SUPABASE_TABLE.ParticipationRequestNotes)
      .insert({ request_id: requestId, note, created_by: user?.id ?? null });
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(SUPABASE_TABLE.ParticipationRequests)
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
