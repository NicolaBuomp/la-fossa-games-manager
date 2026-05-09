import { Injectable, signal } from '@angular/core';
import { ParticipationRequestsService } from './participation-requests.service';
import { SponsorsService } from './sponsors.service';

@Injectable({ providedIn: 'root' })
export class RequestBadgesService {
  readonly tournamentRequests = signal(0);
  readonly sponsorRequests = signal(0);

  constructor(
    private readonly participationRequests: ParticipationRequestsService,
    private readonly sponsors: SponsorsService
  ) {}

  async refresh(): Promise<void> {
    const [tournamentRequests, sponsorRequests] = await Promise.all([
      this.participationRequests.pendingCount(),
      this.sponsors.pendingLeadCount()
    ]);
    this.tournamentRequests.set(tournamentRequests);
    this.sponsorRequests.set(sponsorRequests);
  }

  clear(): void {
    this.tournamentRequests.set(0);
    this.sponsorRequests.set(0);
  }
}
