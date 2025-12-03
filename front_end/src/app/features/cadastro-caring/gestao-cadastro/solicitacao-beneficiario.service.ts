// ...existing code...
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Interfaces alinhadas com o backend
export interface SolicitacaoBeneficiario {
  id?: number;
  numeroSolicitacao?: string;
  beneficiarioId: number;
  beneficiarioCpf: string;
  beneficiarioNome: string;
  tipo: 'INCLUSAO' | 'ALTERACAO' | 'EXCLUSAO';
  status?: 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';
  motivoExclusao?: string;
  dadosJson?: string;
  observacoes?: string;
  dataSolicitacao?: Date;
  dataAprovacao?: Date;
  dataEfetivacao?: Date;
  usuarioSolicitanteId: number;
  usuarioSolicitanteNome: string;
  aprovadorId?: number;
  aprovadorNome?: string;
  observacoesSolicitacao?: string;
  observacoesAprovacao?: string;
  empresaId?: number;
}

export interface SolicitacaoRequest {
  beneficiarioId?: number;
  tipo: 'INCLUSAO' | 'ALTERACAO' | 'EXCLUSAO';
  motivoExclusao?: string;
  dadosPropostos?: any;
  observacoesSolicitacao?: string;
  empresaId?: number;
}

export interface ProcessarSolicitacaoRequest {
  acao: 'APROVAR' | 'REJEITAR';
  observacoesAprovacao?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitacaoBeneficiarioService {

    /**
     * Listar todas as solicitações - GET /api/cadastro/v1/solicitacoes
     */

        /**
         * Listar todas as solicitações - GET /api/cadastro/v1/solicitacoes
         */
        listarTodas(): Observable<SolicitacaoBeneficiario[]> {
          return this.http.get<SolicitacaoBeneficiario[]>(this.baseUrl).pipe(
            catchError(error => of([]))
          );
        }
    /**
     * Listar solicitações pendentes por empresa - GET /api/cadastro/v1/solicitacoes/pendentes?empresaId=xx
     */
    listarPendentesPorEmpresa(empresaId: number): Observable<SolicitacaoBeneficiario[]> {
      const params = new HttpParams().set('empresaId', empresaId.toString());
      return this.http.get<SolicitacaoBeneficiario[]>(`${this.baseUrl}/pendentes`, { params }).pipe(
        catchError(error => of([]))
      );
    }

    /**
     * Listar solicitações compatíveis por empresa
     */
    obterSolicitacoesCompatibilidadePorEmpresa(empresaId: number): Observable<any[]> {
      return this.listarPendentesPorEmpresa(empresaId).pipe(
        map((solicitacoes: SolicitacaoBeneficiario[]) => 
          solicitacoes.map(s => ({
            id: s.id?.toString() || '',
            tipo: s.tipo.toLowerCase() as any,
            entidade: 'Beneficiário',
            identificador: s.beneficiarioCpf,
            descricao: `${s.beneficiarioNome} - ${this.getTipoTexto(s.tipo)}`,
            solicitante: s.usuarioSolicitanteNome,
            codigoEmpresa: s['empresaId'] || '',
            data: s.dataSolicitacao?.toString() || new Date().toISOString(),
            status: this.convertStatusParaAntigo(s.status || 'PENDENTE'),
            observacao: s.observacoesSolicitacao,
            historico: []
          }))
        )
      );
    }
  private readonly baseUrl = 'http://localhost:8081/api/cadastro/v1/solicitacoes';

  constructor(private http: HttpClient) {}

  /**
   * Criar nova solicitação - POST /api/cadastro/v1/solicitacoes
   */
  criarSolicitacao(request: SolicitacaoRequest): Observable<SolicitacaoBeneficiario> {
    return this.http.post<SolicitacaoBeneficiario>(this.baseUrl, request).pipe(
      map(response => response),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Listar solicitações pendentes - GET /api/cadastro/v1/solicitacoes/pendentes
   */
  listarPendentes(): Observable<SolicitacaoBeneficiario[]> {
    return this.http.get<SolicitacaoBeneficiario[]>(`${this.baseUrl}/pendentes`).pipe(
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Processar solicitação - PUT /api/cadastro/v1/solicitacoes/{id}/processar
   */
  processarSolicitacao(
    id: number,
    request: ProcessarSolicitacaoRequest
  ): Observable<SolicitacaoBeneficiario> {
    return this.http.put<SolicitacaoBeneficiario>(`${this.baseUrl}/${id}/processar`, request).pipe(
      catchError(error => {
        console.error('❌ Erro ao processar solicitação:', error);
        throw error;
      })
    );
  }

  /**
   * Buscar solicitação por ID - GET /api/cadastro/v1/solicitacoes/{id}
   */
  buscarPorId(id: number): Observable<SolicitacaoBeneficiario> {
    return this.http.get<SolicitacaoBeneficiario>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error('❌ Erro ao buscar solicitação:', error);
        throw error;
      })
    );
  }

  /**
   * Método para compatibility com AprovacaoService existente
   * Converte SolicitacaoBeneficiario para Solicitacao (formato antigo)
   */
  obterSolicitacoesCompatibilidade(): Observable<any[]> {
    return this.listarPendentes().pipe(
      map((solicitacoes: SolicitacaoBeneficiario[]) => 
        solicitacoes.map(s => ({
          id: s.id?.toString() || '',
          tipo: s.tipo.toLowerCase() as any,
          entidade: 'Beneficiário',
          identificador: s.beneficiarioCpf,
          descricao: `${s.beneficiarioNome} - ${this.getTipoTexto(s.tipo)}`,
          solicitante: s.usuarioSolicitanteNome,
          codigoEmpresa: '', // TODO: Adicionar empresa_id na API
          data: s.dataSolicitacao?.toString() || new Date().toISOString(),
          status: this.convertStatusParaAntigo(s.status || 'PENDENTE'),
          observacao: s.observacoesSolicitacao,
          historico: []
        }))
      )
    );
  }

  private getTipoTexto(tipo: string): string {
    const tipos = {
      'INCLUSAO': 'Inclusão',
      'ALTERACAO': 'Alteração', 
      'EXCLUSAO': 'Exclusão'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  }

  private convertStatusParaAntigo(status: string): string {
    const statusMap = {
      'PENDENTE': 'pendente',
      'APROVADA': 'concluida',
      'REJEITADA': 'aguardando',
      'CANCELADA': 'aguardando'
    };
    return statusMap[status as keyof typeof statusMap] || 'pendente';
  }
}