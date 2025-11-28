import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Se não há token ou é a requisição de login, não adiciona o token
  if (!token || req.url.includes('/login')) {
    return next(req);
  }

  // Clona a requisição e adiciona o header Authorization
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });

  return next(authReq);
};