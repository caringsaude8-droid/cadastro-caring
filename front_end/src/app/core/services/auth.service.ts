import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EmpresaContextService } from '../../shared/services/empresa-context.service';
import { EmpresaService } from '../../features/cadastro-caring/empresa/empresa.service';

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

  constructor(
    private http: HttpClient,
    private empresaContextService: EmpresaContextService,
    private empresaService: EmpresaService
  ) {
    // Carrega usuário do localStorage na inicialização
    const user = this.loadUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
      
      // Se usuário tem empresa vinculada, carregar empresa automaticamente
      if (user.empresaId && this.isAuthenticated()) {
        this.carregarEmpresaDoUsuario(user.empresaId);
      }
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
    // Limpa empresa selecionada antes de fazer login (reset obrigatório)
    this.empresaContextService.clearEmpresaSelecionada();
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          // Salva tokens e dados do usuário
          this.saveAuthData(response);
          this.currentUserSubject.next(response.user);
          
          // Se usuário tem empresaId vinculado, carregar automaticamente após reset
          if (response.user.empresaId) {
            this.carregarEmpresaDoUsuario(response.user.empresaId);
          }
        })
      );
  }

  // Carrega empresa do usuário logado
  private carregarEmpresaDoUsuario(empresaId: number): void {
    this.empresaService.obterEmpresa(empresaId).subscribe({
      next: (empresa: any) => {
        this.empresaContextService.setEmpresaSelecionada(empresa);
      },
      error: (error: any) => {
        console.error('Erro ao carregar empresa do usuário:', error);
      }
    });
  }

  // Obtém o usuário atual
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }
  
  // Verifica se usuário tem empresa vinculada
  hasEmpresaVinculada(): boolean {
    const user = this.getCurrentUser();
    return !!(user && user.empresaId);
  }
  
  // Obtém ID da empresa do usuário
  getEmpresaId(): number | null {
    const user = this.getCurrentUser();
    return user?.empresaId || null;
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
      
      // Limpa empresa selecionada ao fazer logout
      this.empresaContextService.clearEmpresaSelecionada();
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