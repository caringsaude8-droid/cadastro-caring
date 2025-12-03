import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EmpresaContextService } from '../../shared/services/empresa-context.service';

export const empresaInterceptor: HttpInterceptorFn = (req, next) => {
  const empresaContextService = inject(EmpresaContextService);
  
  // Verificar se é uma requisição para APIs de beneficiários
  if (shouldAddEmpresaId(req.url)) {
    const empresaSelecionada = empresaContextService.getEmpresaSelecionada();
    
    if (empresaSelecionada) {
      // Adicionar ID da empresa como header
      const modifiedReq = req.clone({
        setHeaders: {
          'X-Empresa-Id': empresaSelecionada.id?.toString() || '',
          'X-Empresa-Codigo': empresaSelecionada.codigoEmpresa || ''
        }
      });
      
      return next(modifiedReq);
    }
  }

  return next(req);
};

function shouldAddEmpresaId(url: string): boolean {
  // Adicionar empresa ID apenas para APIs de beneficiários
  return url.includes('/beneficiarios') || 
         url.includes('/movimentacoes') || 
         url.includes('/inclusoes') ||
         url.includes('/alteracoes') ||
         url.includes('/exclusoes') ||
         url.includes('/solicitacoes');
}