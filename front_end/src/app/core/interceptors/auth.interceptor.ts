import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ErrorService } from '../../shared/services/error.service';
import { catchError, switchMap, throwError, Subject, of } from 'rxjs';

let isRefreshing = false;
let refreshSubject: Subject<string | null> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const errorService = inject(ErrorService) as ErrorService;
  const token = authService.getToken();

  // Se não há token ou é a requisição de login/refresh, não adiciona o token
  if (!token || req.url.includes('/login') || req.url.includes('/refresh')) {
    return next(req);
  }

  // Não fazer verificação prévia - deixar o backend decidir se o token é válido

  // Clona a requisição e adiciona o header Authorization
  
  
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  
  // Verificar se o header foi adicionado corretamente
  const authHeader = authReq.headers.get('Authorization');

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/refresh')) {
        const token = authService.getToken();
        if (!isRefreshing) {
          
          isRefreshing = true;
          refreshSubject = new Subject<string | null>();

          return authService.refreshToken().pipe(
            switchMap(() => {
              const newToken = authService.getToken();
              isRefreshing = false;
              refreshSubject?.next(newToken || null);
              refreshSubject?.complete();
              const newReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${newToken}`)
              });
              return next(newReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              try { refreshSubject?.error(refreshError); } catch (_) {}
              refreshSubject = null;
              errorService.notifyHttp(refreshError);
              return throwError(() => error);
            })
          );
        } else {
          if (refreshSubject) {
            return refreshSubject.pipe(
              switchMap((t) => {
                const newToken = t || authService.getToken() || '';
                const newReq = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                });
                return next(newReq);
              })
            );
          }
        }
      }

      return throwError(() => error);
    })
  );
};
