import { Injectable, signal } from "@angular/core";
import { ParticipationRequestsService } from "./participation-requests.service";
import { SponsorsService } from "./sponsors.service";

@Injectable({ providedIn: "root" })
export class RequestBadgesService {
  readonly tournamentRequests = signal(0);
  readonly sponsorRequests = signal(0);

  constructor(
    private readonly participationRequests: ParticipationRequestsService,
    private readonly sponsors: SponsorsService,
  ) {}

  async refresh(): Promise<void> {
    const [tournamentRequestsResult, sponsorRequestsResult] =
      await Promise.allSettled([
        this.participationRequests.pendingCount(),
        this.sponsors.pendingLeadCount(),
      ]);

    this.tournamentRequests.set(
      tournamentRequestsResult.status === "fulfilled"
        ? tournamentRequestsResult.value
        : 0,
    );
    this.sponsorRequests.set(
      sponsorRequestsResult.status === "fulfilled"
        ? sponsorRequestsResult.value
        : 0,
    );
  }

  clear(): void {
    this.tournamentRequests.set(0);
    this.sponsorRequests.set(0);
  }
}
