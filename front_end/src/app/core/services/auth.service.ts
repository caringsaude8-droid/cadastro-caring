import { Injectable } from '@angular/core';

export interface AuthUser {
  id?: string;
  nome?: string;
  perfil?: string; // e.g., 'admin', 'terapeuta', 'supervisor', 'recepcao'
  roles: string[]; // permission identifiers
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Lê roles da query string para facilitar testes: ?role=admin ou ?roles=a,b
  private getQueryRoles(): { perfil?: string; roles: string[] } {
    try {
      if (typeof window === 'undefined') return { roles: [] };
      const params = new URLSearchParams(window.location.search);
      const role = params.get('role');
      const rolesParam = params.get('roles');
      const roles: string[] = [];
      let perfil: string | undefined = undefined;

      if (role) {
        if (role === 'admin') {
          perfil = 'admin';
          roles.push('admin');
        } else {
          perfil = role;
        }
      }

      if (rolesParam) {
        rolesParam.split(',').map(r => r.trim()).forEach(r => r && roles.push(r));
      }

      return { perfil, roles };
    } catch (_) {
      return { roles: [] };
    }
  }
  // Obtém o usuário atual do localStorage. Se vazio, aplica um mock seguro.
  getCurrentUser(): AuthUser {
    try {
      // Override por query string (para testes rápidos)
      const query = this.getQueryRoles();
      if (query.perfil || (query.roles && query.roles.length)) {
        return {
          nome: 'Usuário (query)',
          perfil: query.perfil || 'usuario',
          roles: query.roles || []
        };
      }

      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        // Garante estrutura mínima
        return {
          id: parsed.id,
          nome: parsed.nome || 'Usuário',
          perfil: parsed.perfil || 'usuario',
          roles: Array.isArray(parsed.roles) ? parsed.roles : []
        };
      }
    } catch (_) {
      // Ignora erros de parse e cai no mock
    }

    // Mock quando não há auth configurado
    return {
      nome: 'Usuário (mock)',
      perfil: 'usuario',
      roles: ['tea:clinica', 'tea:calendario']
    };
  }

  // Define o usuário atual em localStorage (útil para testes via UI)
  setCurrentUser(user: Partial<AuthUser>) {
    try {
      const current = this.getCurrentUser();
      const updated: AuthUser = {
        id: user.id ?? current.id,
        nome: user.nome ?? current.nome,
        perfil: user.perfil ?? current.perfil,
        roles: user.roles ?? current.roles ?? []
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auth', JSON.stringify(updated));
      }
    } catch (_) {
      // ignore
    }
  }

  // Retorna os roles atuais
  getRoles(): string[] {
    const user = this.getCurrentUser();
    return user.roles || [];
  }

  // Verifica se possui pelo menos um dos roles requeridos
  hasAnyRole(required: string[] | undefined | null): boolean {
    if (!required || required.length === 0) return true;
    const roles = this.getRoles();
    return required.some(r => roles.includes(r));
  }

  // Verifica se usuário é admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return (user.perfil === 'admin') || (user.roles || []).includes('admin');
  }

  signOut() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('auth');
      }
    } catch (_) {
      // ignore
    }
    console.log('User signed out');
  }
}