import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Se não há token ou é a requisição de login/refresh, não adiciona o token
  if (!token || req.url.includes('/login') || req.url.includes('/refresh')) {
    console.log('🚫 Não adicionando token para:', req.url, 'Token presente:', !!token);
    return next(req);
  }

  // Não fazer verificação prévia - deixar o backend decidir se o token é válido

  // Clona a requisição e adiciona o header Authorization
  console.log('🔑 Adicionando token à requisição:', req.url, 'Token:', token.substring(0, 50) + '...');
  
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  
  // Verificar se o header foi adicionado corretamente
  const authHeader = authReq.headers.get('Authorization');
  console.log('✅ Header Authorization adicionado:', authHeader ? 'SIM' : 'NÃO');
  if (authHeader) {
    console.log('🔧 Valor do header:', authHeader.substring(0, 70) + '...');
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing && !req.url.includes('/refresh')) {
        // Verificar se o token realmente expirou ou se é outro problema
        const token = authService.getToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = payload.exp - now;
            console.log('🕰️ Token ainda válido por:', Math.floor(timeLeft / 60), 'minutos');
            console.log('⚠️ API retornou 401 mas token não expirou - problema na API!');
          } catch (e) {
            console.log('❌ Token malformado');
          }
        }
        
        console.log('🔄 401 recebido - Tentando renovar token...');
        isRefreshing = true;
        
        return authService.refreshToken().pipe(
          switchMap(() => {
            console.log('✅ Token renovado, reenviando requisição');
            const newToken = authService.getToken();
            console.log('🔑 Novo token que será usado na requisição:', newToken?.substring(0, 50) + '...');
            isRefreshing = false;
            const newReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${newToken}`)
            });
            console.log('📤 Reenviando requisição com novo token para:', req.url);
            console.log('🔧 Header Authorization da nova requisição:', newReq.headers.get('Authorization')?.substring(0, 70) + '...');
            return next(newReq);
          }),
          catchError((refreshError) => {
            console.log('❌ Erro ao renovar token:', refreshError);
            console.log('🚫 NÃO redirecionando para login - usuário deve fazer logout manual');
            isRefreshing = false;
            return throwError(() => error);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};