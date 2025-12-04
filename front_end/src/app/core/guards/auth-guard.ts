import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Primeiro, verifica se está autenticado
  if (!auth.isAuthenticated()) {
    // Se não está autenticado, limpa qualquer dado residual e redireciona
    auth.signOut();
    router.navigate(['/login']);
    return false;
  }

  const requiredProfiles = (route.data?.['profiles'] as string[] | undefined) || [];

  // Admin passa sempre
  if (auth.isAdmin()) return true;

  // Quando não há requisito, permite acesso
  if (!requiredProfiles || requiredProfiles.length === 0) return true;

  // Caso o perfil do usuário esteja entre os permitidos
  const user = auth.getCurrentUser();
  if (
    user &&
    requiredProfiles.some(
      p => (user.perfil || '').toLowerCase() === p.toLowerCase()
    )
  ) return true;

  // Sem permissão: acesso negado
  return false;
};
