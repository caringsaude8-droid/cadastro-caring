// ...existing code...
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
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
  beneficiarioNome?: string;
  beneficiarioCpf?: string;
  tipo: 'INCLUSAO' | 'ALTERACAO' | 'EXCLUSAO';
  motivoExclusao?: string;
  dadosPropostos?: any;
  observacoesSolicitacao?: string;
  observacoes?: string;
  observacoesAprovacao?: string;
  empresaId?: number;
  anexos?: {
    nomeOriginal: string;
    base64: string;
    tipoMime: string;
    tamanho: number;
  }[];
}

export interface ProcessarSolicitacaoRequest {
  acao: 'APROVAR' | 'REJEITAR';
  observacoesAprovacao?: string;
  dadosAprovacao?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitacaoBeneficiarioService {
  private solicitacoesSubject = new BehaviorSubject<SolicitacaoBeneficiario[]>([]);
  private cachedEmpresaId: number | null = null;
  public solicitacoes$ = this.solicitacoesSubject.asObservable();

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
         * Listar todas as solicitações de uma empresa - GET /api/cadastro/v1/solicitacoes?empresaId=xx
         */
        listarTodasPorEmpresa(empresaId: number): Observable<SolicitacaoBeneficiario[]> {
          const params = new HttpParams().set('empresaId', empresaId.toString());
          return this.http.get<SolicitacaoBeneficiario[]>(this.baseUrl, { params }).pipe(
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
          solicitacoes.map(s => {
            // Converte datas de dd/MM/yyyy [HH:mm] para ISO, evitando erros do DatePipe
            const toIso = (d: any): string => {
              try {
                if (!d) return new Date().toISOString();
                if (d instanceof Date) return d.toISOString();
                if (typeof d === 'string') {
                  // dd/MM/yyyy HH:mm[:ss]
                  const m1 = d.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
                  if (m1) {
                    const dia = parseInt(m1[1], 10);
                    const mes = parseInt(m1[2], 10) - 1;
                    const ano = parseInt(m1[3], 10);
                    const hora = m1[4] ? parseInt(m1[4], 10) : 0;
                    const min = m1[5] ? parseInt(m1[5], 10) : 0;
                    const seg = m1[6] ? parseInt(m1[6], 10) : 0;
                    return new Date(ano, mes, dia, hora, min, seg).toISOString();
                  }
                  // yyyy-MM-dd HH:mm:ss[.SSS]
                  const m2 = d.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?$/);
                  if (m2) {
                    const ano = parseInt(m2[1], 10);
                    const mes = parseInt(m2[2], 10) - 1;
                    const dia = parseInt(m2[3], 10);
                    const hora = parseInt(m2[4], 10);
                    const min = parseInt(m2[5], 10);
                    const seg = m2[6] ? parseInt(m2[6], 10) : 0;
                    // Ignora milissegundos para consistência
                    return new Date(ano, mes, dia, hora, min, seg).toISOString();
                  }
                  const dt = new Date(d);
                  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
                }
                if (typeof d === 'number') return new Date(d).toISOString();
                const dt = new Date(d);
                return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
              } catch { return new Date().toISOString(); }
            };
            let dadosPropostos: any = undefined;
            try {
              const dadosObj = s?.dadosJson ? JSON.parse(s.dadosJson) : null;
              dadosPropostos = dadosObj && dadosObj.dadosPropostos ? dadosObj.dadosPropostos : dadosObj;
            } catch { dadosPropostos = undefined; }
            return {
            id: s.id?.toString() || '',
            tipo: s.tipo.toLowerCase() as any,
            entidade: 'Beneficiário',
            identificador: s.beneficiarioCpf,
            descricao: `${s.beneficiarioNome} - ${this.getTipoTexto(s.tipo)}`,
            solicitante: s.usuarioSolicitanteNome,
            codigoEmpresa: s['empresaId'] || '',
            data: toIso(s.dataSolicitacao),
          status: this.convertStatusParaAntigo(s.status || 'PENDENTE'),
            observacao: '',
            historico: [],
            dadosJson: s.dadosJson,
            dadosPropostos
          };
          })
        )
      );
    }
  private readonly baseUrl = 'http://localhost:8081/api/cadastro/v1/solicitacoes';
  private readonly historicoUrl = 'http://localhost:8081/api/cadastro/v1/historico';

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

  atualizarSolicitacao(id: number, request: Partial<SolicitacaoRequest>): Observable<SolicitacaoBeneficiario> {
    return this.http.put<SolicitacaoBeneficiario>(`${this.baseUrl}/${id}`, request).pipe(
      catchError(error => {
        console.error('❌ Erro ao atualizar solicitação:', error);
        throw error;
      })
    );
  }

  listarHistorico(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/historico`).pipe(
      catchError(error => {
        console.error('❌ Erro ao buscar histórico:', error);
        return of([]);
      })
    );
  }

  getCached(): SolicitacaoBeneficiario[] {
    return this.solicitacoesSubject.value;
  }

  refresh(empresaId?: number): Observable<SolicitacaoBeneficiario[]> {
    const params = empresaId ? new HttpParams().set('empresaId', String(empresaId)) : undefined;
    const obs = empresaId
      ? this.http.get<SolicitacaoBeneficiario[]>(this.baseUrl, { params }).pipe(catchError(() => of([])))
      : this.http.get<SolicitacaoBeneficiario[]>(this.baseUrl).pipe(catchError(() => of([])));
    return obs.pipe(
      map(lista => {
        this.cachedEmpresaId = empresaId ?? null;
        const arr = Array.isArray(lista) ? lista : [];
        this.solicitacoesSubject.next(arr);
        return arr;
      })
    );
  }

  /**
   * Baixar anexo - GET /api/cadastro/v1/solicitacoes/anexos/{anexoId}/stream
   */
  downloadAnexo(anexoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/anexos/${anexoId}/stream`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('❌ Erro ao baixar anexo:', error);
        throw error;
      })
    );
  }

  /**
   * Atualizar dados propostos de uma solicitação
   * PUT /api/cadastro/v1/solicitacoes/{id}/dados-propostos
   * O corpo da requisição deve ser o novo JSON para o campo dadosJson
   */
  atualizarDadosPropostos(id: number, dadosJson: string): Observable<SolicitacaoBeneficiario> {
    // PUT parcial para atualizar apenas os dadosPropostos (sem alterar status)
    const url = `${this.baseUrl}/${id}/dados-propostos`;
    return this.http.put<SolicitacaoBeneficiario>(url, dadosJson, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(() => {}),
      catchError(error => {
        console.error('❌ Erro ao atualizar dados propostos:', error);
        throw error;
      })
    );
  }

  /**
   * Método para compatibility com AprovacaoService existente
   * Converte SolicitacaoBeneficiario para Solicitacao (formato antigo)
   */
  obterSolicitacoesCompatibilidade(): Observable<any[]> {
    return this.listarTodas().pipe(
      map((solicitacoes: SolicitacaoBeneficiario[]) => 
        solicitacoes.map(s => {
          // Normaliza datas no fluxo de compatibilidade também
          const toIso = (d: any): string => {
            try {
              if (!d) return new Date().toISOString();
              if (d instanceof Date) return d.toISOString();
              if (typeof d === 'string') {
                // dd/MM/yyyy HH:mm[:ss]
                const m1 = d.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
                if (m1) {
                  const dia = parseInt(m1[1], 10);
                  const mes = parseInt(m1[2], 10) - 1;
                  const ano = parseInt(m1[3], 10);
                  const hora = m1[4] ? parseInt(m1[4], 10) : 0;
                  const min = m1[5] ? parseInt(m1[5], 10) : 0;
                  const seg = m1[6] ? parseInt(m1[6], 10) : 0;
                  return new Date(ano, mes, dia, hora, min, seg).toISOString();
                }
                // yyyy-MM-dd HH:mm:ss[.SSS]
                const m2 = d.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?$/);
                if (m2) {
                  const ano = parseInt(m2[1], 10);
                  const mes = parseInt(m2[2], 10) - 1;
                  const dia = parseInt(m2[3], 10);
                  const hora = parseInt(m2[4], 10);
                  const min = parseInt(m2[5], 10);
                  const seg = m2[6] ? parseInt(m2[6], 10) : 0;
                  return new Date(ano, mes, dia, hora, min, seg).toISOString();
                }
                const dt = new Date(d);
                return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
              }
              if (typeof d === 'number') return new Date(d).toISOString();
              const dt = new Date(d);
              return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
            } catch { return new Date().toISOString(); }
          };
          let dadosPropostos: any = undefined;
          try {
            const dadosObj = s?.dadosJson ? JSON.parse(s.dadosJson) : null;
            dadosPropostos = dadosObj && dadosObj.dadosPropostos ? dadosObj.dadosPropostos : dadosObj;
          } catch { dadosPropostos = undefined; }
          return {
          id: s.id?.toString() || '',
          tipo: s.tipo.toLowerCase() as any,
          entidade: 'Beneficiário',
          identificador: s.beneficiarioCpf,
          descricao: `${s.beneficiarioNome} - ${this.getTipoTexto(s.tipo)}`,
          solicitante: s.usuarioSolicitanteNome,
          codigoEmpresa: '', // TODO: Adicionar empresa_id na API quando disponível
          data: toIso(s.dataSolicitacao),
          status: this.convertStatusParaAntigo(s.status || 'PENDENTE'),
          observacoesSolicitacao: s.observacoesSolicitacao,
          observacoesAprovacao: s.observacoesAprovacao,
          historico: [],
          dadosJson: s.dadosJson,
          dadosPropostos
        };
        })
      )
    );
  }

  private getTipoTexto(tipo: string): string {
    // Mapeia tipos da API para labels amigáveis
    const tipos = {
      'INCLUSAO': 'Inclusão',
      'ALTERACAO': 'Alteração', 
      'EXCLUSAO': 'Exclusão'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  }

  private convertStatusParaAntigo(status: string): string {
    // Converte status novos da API para os usados na UI antiga
    const statusMap = {
      'PENDENTE': 'pendente',
      'APROVADA': 'concluida',
      'REJEITADA': 'aguardando',
      'CANCELADA': 'aguardando'
    };
    return statusMap[status as keyof typeof statusMap] || 'pendente';
  }
}
