import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.loading()) {
    await auth.initialize();
  }

  if (auth.isAuthenticated() && auth.isActive()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
