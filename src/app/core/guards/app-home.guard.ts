import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const appHomeGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureReady();

  return router.createUrlTree([auth.isAdmin() ? '/app/dashboard' : '/app/registrations']);
};
