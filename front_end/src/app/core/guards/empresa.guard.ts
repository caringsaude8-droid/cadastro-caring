import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { EmpresaContextService } from '../../shared/services/empresa-context.service';
import { map, take } from 'rxjs/operators';

export const empresaGuard: CanActivateFn = (route, state) => {
  const empresaContextService = inject(EmpresaContextService);
  const router = inject(Router);

  // Usar observable para garantir que esperamos a inicialização completa
  return empresaContextService.empresaSelecionada$.pipe(
    take(1), // Pega apenas o primeiro valor emitido
    map(empresaSelecionada => {
      if (!empresaSelecionada) {
        // Se não há empresa selecionada, redirecionar para seleção de empresa
        router.navigate(['/cadastro-caring/empresa'], {
          queryParams: { 
            message: 'Selecione uma empresa para acessar os beneficiários',
            returnUrl: state.url 
          }
        });
        return false;
      }
      return true;
    })
  );
};