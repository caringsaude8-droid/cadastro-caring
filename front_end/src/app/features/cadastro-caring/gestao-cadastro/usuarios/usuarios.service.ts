import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: number;
  nome: string;
  email: string;
  status: boolean | 'ativo' | 'inativo';
  perfil: string;
  telefone?: string | null;
  empresaId?: number | null;
  cpf?: string;
  senha?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private apiUrl = 'http://localhost:8081/api/cadastro/v1/usuarios';

  constructor(private http: HttpClient) {}

  getUsuarios(): Observable<User[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((usuarios: any[]): User[] =>
        usuarios.map((u: any) => ({
          ...u,
          status: u.status === true ? 'ativo' : 'inativo',
          perfil: (u.perfil || '').toLowerCase()
        }))
      )
    );
  }
  criarUsuario(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }
}
