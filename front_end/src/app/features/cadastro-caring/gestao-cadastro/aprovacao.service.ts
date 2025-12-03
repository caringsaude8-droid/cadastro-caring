import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SolicitacaoBeneficiarioService, SolicitacaoRequest } from './solicitacao-beneficiario.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresaContextService } from '../../../shared/services/empresa-context.service';

export type SolicitacaoStatus = 'pendente' | 'aguardando' | 'concluida';
export type SolicitacaoTipo = 'inclusao' | 'alteracao' | 'exclusao';

export interface Solicitacao {
  id: string;
  tipo: SolicitacaoTipo;
  entidade: string;
  identificador: string;
  descricao: string;
  solicitante: string;
  codigoEmpresa?: string;
  data: string;
  status: SolicitacaoStatus;
  observacao?: string;
  historico?: { data: string; status: SolicitacaoStatus; observacao?: string }[];
}

@Injectable({ providedIn: 'root' })
export class AprovacaoService {
  private solicitacoesSubject = new BehaviorSubject<Solicitacao[]>([]);
  public solicitacoes$ = this.solicitacoesSubject.asObservable();

  constructor(
    private solicitacaoService: SolicitacaoBeneficiarioService,
    private authService: AuthService,
    private empresaContextService: EmpresaContextService
  ) {
    // Carregar solicitações iniciais
    this.atualizarSolicitacoes();
  }

  list(): Solicitacao[] {
    return this.solicitacoesSubject.value;
  }

  add(partial: Omit<Solicitacao, 'id' | 'data' | 'status'> & { 
    status?: SolicitacaoStatus; 
    data?: string;
    // Novos campos opcionais para integração com API
    beneficiarioId?: number;
    motivoExclusao?: string;
    dadosPropostos?: any;
  }): Solicitacao {
    
    // Se temos dados para criar na nova API, fazer isso
    if (partial.beneficiarioId || partial.tipo === 'inclusao') {
      const request: SolicitacaoRequest = {
        beneficiarioId: partial.beneficiarioId,
        tipo: partial.tipo.toUpperCase() as any,
        motivoExclusao: partial.motivoExclusao,
        dadosPropostos: partial.dadosPropostos,
        observacoesSolicitacao: partial.observacao
      };

      this.solicitacaoService.criarSolicitacao(request).subscribe({
        next: (response) => {
          // Não precisa recarregar automaticamente - será feito manualmente
        },
        error: (error) => {
          // Fallback: criar localmente para não quebrar o fluxo
          this.criarSolicitacaoLocal(partial);
        }
      });
    } else {
      // Criar apenas localmente (para compatibilidade com código existente)
      return this.criarSolicitacaoLocal(partial);
    }

    // Retornar uma solicitação temporária
    return this.criarSolicitacaoLocal(partial);
  }

  private criarSolicitacaoLocal(partial: Omit<Solicitacao, 'id' | 'data' | 'status'> & { 
    status?: SolicitacaoStatus; 
    data?: string 
  }): Solicitacao {
    const s: Solicitacao = {
      id: String(Date.now()),
      tipo: partial.tipo,
      entidade: partial.entidade,
      identificador: partial.identificador,
      descricao: partial.descricao,
      solicitante: partial.solicitante,
      codigoEmpresa: partial.codigoEmpresa,
      data: partial.data || new Date().toISOString(),
      status: partial.status || 'pendente',
      observacao: partial.observacao,
      historico: [{ 
        data: new Date().toISOString(), 
        status: partial.status || 'pendente', 
        observacao: partial.observacao 
      }]
    };

    const current = this.solicitacoesSubject.value;
    this.solicitacoesSubject.next([s, ...current]);
    return s;
  }

  updateStatus(id: string, status: SolicitacaoStatus, observacao?: string): void {
    // Tentar processar na nova API primeiro
    const idNumerico = parseInt(id);
    if (!isNaN(idNumerico)) {
      const acao = status === 'concluida' ? 'APROVAR' : 'REJEITAR';
      
      this.solicitacaoService.processarSolicitacao(idNumerico, {
        acao,
        observacoesAprovacao: observacao
      }).subscribe({
        next: (response) => {
          // Lista será atualizada manualmente ou via timer
        },
        error: (error) => {
          // Fallback: atualizar localmente
          this.updateStatusLocal(id, status, observacao);
        }
      });
    } else {
      // ID não numérico = solicitação local apenas
      this.updateStatusLocal(id, status, observacao);
    }
  }

  private updateStatusLocal(id: string, status: SolicitacaoStatus, observacao?: string): void {
    const current = this.solicitacoesSubject.value;
    const idx = current.findIndex(s => s.id === id);
    
    if (idx >= 0) {
      const solicitacao = current[idx];
      const hist = (solicitacao.historico || []).concat([{ 
        data: new Date().toISOString(), 
        status, 
        observacao 
      }]);
      
      const updated = { ...solicitacao, status, observacao, historico: hist };
      const newList = [...current];
      newList[idx] = updated;
      
      this.solicitacoesSubject.next(newList);
    }
  }

  /**
   * Método público para atualizar lista (botão "Atualizar" na UI)
   */
  atualizarSolicitacoes(): void {
    this.solicitacaoService.obterSolicitacoesCompatibilidade().subscribe({
      next: (solicitacoes) => {
        this.solicitacoesSubject.next(solicitacoes);
      },
      error: (error) => {
        // Erro silencioso
      }
    });
  }

  /**
   * Método helper para criar solicitação de exclusão de beneficiário
   */
  criarSolicitacaoExclusao(beneficiario: any, motivo: string, observacoes?: string): Observable<any> {
    
    const request: SolicitacaoRequest = {
      beneficiarioId: beneficiario.id,
      tipo: 'EXCLUSAO',
      motivoExclusao: motivo,
      observacoesSolicitacao: observacoes
    };

    return this.solicitacaoService.criarSolicitacao(request);
  }

  /**
   * Método helper para criar solicitação de alteração de beneficiário
   */
  criarSolicitacaoAlteracao(
    beneficiario: any, 
    dadosPropostos: any, 
    observacoes?: string,
    empresaId?: number
  ): Observable<any> {
    const request: SolicitacaoRequest = {
      beneficiarioId: beneficiario.id,
      tipo: 'ALTERACAO',
      dadosPropostos: dadosPropostos,
      observacoesSolicitacao: observacoes,
      empresaId
    };
    return this.solicitacaoService.criarSolicitacao(request);
  }

  /**
   * Método helper para criar solicitação de inclusão de beneficiário
   */
  criarSolicitacaoInclusao(dadosPropostos: any, observacoes?: string): Observable<any> {
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    const request: SolicitacaoRequest = {
      tipo: 'INCLUSAO',
      dadosPropostos: dadosPropostos,
      observacoesSolicitacao: observacoes,
      empresaId: empresa?.id
    };

    return this.solicitacaoService.criarSolicitacao(request);
  }
 
}
