import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard que valida acesso por roles definidos em route.data.roles
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = (route.data?.['roles'] as string[] | undefined) || [];

  // Admin passa sempre
  if (auth.isAdmin()) return true;

  // Quando não há requisito, permite acesso
  if (!requiredRoles || requiredRoles.length === 0) return true;

  // Caso tenha algum dos roles necessários, permite
  if (auth.hasAnyRole(requiredRoles)) return true;

  // Sem permissão: redireciona para uma rota segura
  router.navigate(['/home']);
  return false;
};
