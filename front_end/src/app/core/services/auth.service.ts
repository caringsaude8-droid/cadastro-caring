import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
      
      // Carregar empresa será feito após autenticação, não no construtor
      // para evitar dependência circular com interceptors
      setTimeout(() => {
        if (user.empresaId && this.isAuthenticated()) {
          this.carregarEmpresaDoUsuario(user.empresaId);
        }
      }, 100);
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
    const refreshToken = this.getRefreshToken();
    
    if (!token) {
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Verifica se o token principal está válido (sem margem - deixa o backend decidir)
      const isValid = payload.exp > now;
      
      if (!isValid) {
        // Token expirado - apenas retorna false, não faz signOut automático
        return false;
      }
      
      return true;
    } catch (error) {
      this.signOut(); // Remove tokens malformados
      return false;
    }
  }

  // Verifica se o token está próximo de expirar (dentro de 5 minutos)
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;
      return expiresIn < 300; // 5 minutos
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

  // Renova o token usando refresh token
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.signOut();
      return throwError(() => new Error('Refresh token não encontrado'));
    }

    const requestBody = { refreshToken };
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, requestBody)
      .pipe(
        tap(response => {
          this.saveAuthData(response);
          this.currentUserSubject.next(response.user);
        }),
        catchError(error => {
          // Se refresh token expirou (403/401), apenas informa - NÃO faz logout automático
          if (error.status === 403 || error.status === 401) {
            return throwError(() => new Error('Refresh token expirado. Faça login novamente.'));
          }
          
          // Outros erros, apenas limpa
          this.signOut();
          return throwError(() => error);
        })
      );
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
    // Apenas faz logout se há tokens mas eles estão inválidos
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        
        // Se token está REALMENTE expirado, faz logout
        if (payload.exp <= now) {
          this.signOut();
        }
        // Se token está válido, não faz nada (deixa o usuário acessar)
      } catch {
        // Token malformado, remove
        this.signOut();
      }
    }
    // Se não há token, também não faz nada
  }

  // Salva dados de autenticação no localStorage
  private saveAuthData(response: LoginResponse): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('refresh_token', response.refreshToken);
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }
    } catch (error) {
      // Erro silencioso
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



  // Força um novo login (limpa tudo e redireciona)
  forceReauth(): void {
    this.signOut();
    
    // Redireciona diretamente sem alert para melhor UX
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }
}
