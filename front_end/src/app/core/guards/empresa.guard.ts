import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { EmpresaContextService } from '../../shared/services/empresa-context.service';

export const empresaGuard: CanActivateFn = (route, state) => {
  const empresaContextService = inject(EmpresaContextService);
  const router = inject(Router);

  // Verificar se há empresa selecionada
  const empresaSelecionada = empresaContextService.getEmpresaSelecionada();

  if (!empresaSelecionada) {
    // Se não há empresa selecionada, redirecionar para seleção de empresa
    // com uma mensagem de aviso
    router.navigate(['/cadastro-caring/empresa'], {
      queryParams: { 
        message: 'Selecione uma empresa para acessar os beneficiários',
        returnUrl: state.url 
      }
    });
    return false;
  }

  return true;
};