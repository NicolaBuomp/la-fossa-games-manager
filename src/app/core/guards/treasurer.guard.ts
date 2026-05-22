import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const treasurerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureReady();

  if (auth.isAuthenticated() && auth.isActive() && auth.canAccessTreasury()) {
    return true;
  }

  return router.createUrlTree(['/app']);
};
