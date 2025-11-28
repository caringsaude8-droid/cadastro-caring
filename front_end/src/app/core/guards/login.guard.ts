import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard que redireciona usuários já autenticados para home
export const loginGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Se já está autenticado, redireciona para home
  if (auth.isAuthenticated()) {
    router.navigate(['/home']);
    return false;
  }

  // Se não está autenticado, permite acesso ao login
  return true;
};