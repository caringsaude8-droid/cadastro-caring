import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ErrorService } from '../../shared/services/error.service';


export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const errorService = inject(ErrorService) as ErrorService;

  const requiredProfiles = (route.data?.['profiles'] as string[] | undefined) || [];

  const allowByProfile = (): boolean => {
    if (auth.isAdmin()) return true;
    if (!requiredProfiles || requiredProfiles.length === 0) return true;
    const user = auth.getCurrentUser();
    return !!(user && requiredProfiles.some(p => (user.perfil || '').toLowerCase() === p.toLowerCase()));
  };

  if (auth.isAuthenticated()) {
    return allowByProfile();
  }

  if (!auth.getRefreshToken()) {
    errorService.notify('Sessão não autenticada. Faça login para acessar esta área.', 'Autenticação necessária');
    router.navigate(['/login']);
    return false;
  }

  return auth.refreshToken().pipe(
    map(() => allowByProfile()),
    catchError((err) => {
      errorService.notifyHttp(err);
      router.navigate(['/login']);
      return of(false);
    })
  );
};
