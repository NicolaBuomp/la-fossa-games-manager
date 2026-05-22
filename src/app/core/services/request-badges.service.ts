import { Injectable, signal } from "@angular/core";
import { RealtimeChannel } from "@supabase/supabase-js";
import { AuthService } from "./auth.service";
import { ParticipationRequestsService } from "./participation-requests.service";
import { SponsorsService } from "./sponsors.service";
import { SupabaseService } from "./supabase.service";
import { SUPABASE_TABLE } from "../types/constants";

@Injectable({ providedIn: "root" })
export class RequestBadgesService {
  readonly tournamentRequests = signal(0);
  readonly sponsorRequests = signal(0);

  private participationChannel: RealtimeChannel | null = null;
  private sponsorChannel: RealtimeChannel | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly supabase: SupabaseService,
    private readonly participationRequests: ParticipationRequestsService,
    private readonly sponsors: SponsorsService,
  ) {}

  async startWatching(): Promise<void> {
    if (!this.auth.isAdmin()) {
      this.clear();
      return;
    }

    await Promise.allSettled([
      this.fetchParticipationCount(),
      this.fetchSponsorCount(),
    ]);

    this.participationChannel = this.supabase.client
      .channel("badge-participation-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: SUPABASE_TABLE.ParticipationRequests },
        () => void this.fetchParticipationCount(),
      )
      .subscribe();

    this.sponsorChannel = this.supabase.client
      .channel("badge-sponsors")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: SUPABASE_TABLE.Sponsors },
        () => void this.fetchSponsorCount(),
      )
      .subscribe();
  }

  async stopWatching(): Promise<void> {
    if (this.participationChannel) {
      await this.supabase.client.removeChannel(this.participationChannel);
      this.participationChannel = null;
    }
    if (this.sponsorChannel) {
      await this.supabase.client.removeChannel(this.sponsorChannel);
      this.sponsorChannel = null;
    }
  }

  clear(): void {
    this.tournamentRequests.set(0);
    this.sponsorRequests.set(0);
  }

  private async fetchParticipationCount(): Promise<void> {
    try {
      this.tournamentRequests.set(
        await this.participationRequests.pendingCount(),
      );
    } catch {
      this.tournamentRequests.set(0);
    }
  }

  private async fetchSponsorCount(): Promise<void> {
    try {
      this.sponsorRequests.set(await this.sponsors.pendingLeadCount());
    } catch {
      this.sponsorRequests.set(0);
    }
  }
}
