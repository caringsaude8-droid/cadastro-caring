import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Empresa {
  id?: number;
  nome: string;
  cnpj: string;
  cidade: string;
  uf: string;
  email: string;
  telefone: string;
  codigoEmpresa: string;
  numeroEmpresa: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private readonly apiUrl = 'http://localhost:8081/api/cadastro/v1/empresas';

  constructor(private http: HttpClient) {}

  // Buscar todas as empresas
  listarEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.apiUrl);
  }

  // Buscar empresa por ID
  buscarEmpresaPorId(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/${id}`);
  }

  // Obter empresa por ID (alias para buscarEmpresaPorId)
  obterEmpresa(id: number): Observable<Empresa> {
    return this.buscarEmpresaPorId(id);
  }

  // Criar nova empresa
  criarEmpresa(empresa: Omit<Empresa, 'id'>): Observable<Empresa> {
    return this.http.post<Empresa>(this.apiUrl, empresa);
  }

  // Atualizar empresa
  atualizarEmpresa(id: number, empresa: Omit<Empresa, 'id'>): Observable<Empresa> {
    return this.http.put<Empresa>(`${this.apiUrl}/${id}`, empresa);
  }

  // Deletar empresa
  deletarEmpresa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}