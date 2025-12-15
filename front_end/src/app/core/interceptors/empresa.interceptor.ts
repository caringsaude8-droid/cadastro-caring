import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { EmpresaContextService } from '../../shared/services/empresa-context.service';
import { catchError, throwError, finalize } from 'rxjs';
import { ErrorService } from '../../shared/services/error.service';
import { LoadingOverlayService } from '../../shared/services/loading-overlay.service';

export const empresaInterceptor: HttpInterceptorFn = (req, next) => {
  const empresaContextService = inject(EmpresaContextService);
  const errorService = inject(ErrorService) as ErrorService;
  const loadingService = inject(LoadingOverlayService) as LoadingOverlayService;
  
  const shouldShow = shouldShowGlobalLoading(req.method, req.url);
  if (shouldShow) {
    const msg = buildLoadingMessage(req.method, req.url);
    loadingService.show(msg);
  }
  
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
      return next(modifiedReq).pipe(
        catchError((error: HttpErrorResponse) => {
          errorService.notifyHttp(error);
          return throwError(() => error);
        }),
        finalize(() => { if (shouldShow) loadingService.hide(); })
      );
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      errorService.notifyHttp(error);
      return throwError(() => error);
    }),
    finalize(() => { if (shouldShow) loadingService.hide(); })
  );
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

function shouldShowGlobalLoading(method: string, url: string): boolean {
  const m = (method || '').toUpperCase();
  if (url.includes('/login') || url.includes('/refresh')) return false;
  const isMutating = m === 'POST' || m === 'PUT' || m === 'DELETE';
  const isCadastroFlow = url.includes('/beneficiarios') || url.includes('/solicitacoes');
  return isMutating && isCadastroFlow;
}

function buildLoadingMessage(method: string, url: string): string {
  const m = (method || '').toUpperCase();
  if (url.includes('/solicitacoes')) {
    return 'Processando solicitação...';
  }
  if (url.includes('/beneficiarios')) {
    if (m === 'PUT') return 'Aplicando atualização...';
    if (m === 'DELETE') return 'Aplicando exclusão...';
    if (m === 'POST') return 'Incluindo beneficiário...';
  }
  return 'Processando...';
}
