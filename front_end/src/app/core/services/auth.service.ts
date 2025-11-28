import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  status: boolean;
  perfil: string;
  empresaId: number | null;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8081/api/cadastro/v1/usuarios';
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Carrega usuário do localStorage na inicialização
    const user = this.loadUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }

    // Verifica autenticação quando página carrega ou usuário navega
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.checkAuthOnFocus());
      window.addEventListener('pageshow', () => this.checkAuthOnFocus());
    }
  }

  private checkAuthOnFocus(): void {
    // Se não está autenticado mas há dados no localStorage, limpa tudo
    if (!this.isAuthenticated() && this.loadUserFromStorage()) {
      this.signOut();
    }
  }

  // Faz login na API
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          // Salva tokens e dados do usuário
          this.saveAuthData(response);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  // Obtém o usuário atual
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  // Verifica se está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Verifica se o token não expirou
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // Obtém o token JWT
  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Obtém o refresh token
  getRefreshToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // Verifica se usuário é admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return !!user && user.perfil.toLowerCase() === 'admin';
  }

  // Logout
  signOut(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');
      }
      this.currentUserSubject.next(null);
    } catch (_) {
      // ignore
    }
  }

  // Logout automático quando usuário tenta acessar login estando logado
  autoSignOutOnLoginAccess(): void {
    if (this.isAuthenticated()) {
      this.signOut();
    }
  }

  // Salva dados de autenticação no localStorage
  private saveAuthData(response: LoginResponse): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('refresh_token', response.refreshToken);
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }
    } catch (_) {
      // ignore
    }
  }

  // Carrega usuário do localStorage
  private loadUserFromStorage(): AuthUser | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const userData = localStorage.getItem('current_user');
        if (userData) {
          return JSON.parse(userData);
        }
      }
    } catch (_) {
      // ignore
    }
    return null;
  }
}