import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SolicitacaoBeneficiarioService, SolicitacaoRequest } from './solicitacao-beneficiario.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresaContextService } from '../../../shared/services/empresa-context.service';

export type SolicitacaoStatus = 'pendente' | 'aguardando' | 'concluida';
export type SolicitacaoTipo = 'inclusao' | 'alteracao' | 'exclusao';

export interface Solicitacao {
    dadosJson?: string;
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
  observacoesSolicitacao?: string;
  historico?: { data: string; status: SolicitacaoStatus; observacao?: string }[];
  observacoesAprovacao?: string;
  dadosPropostos?: any;
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
  }): Solicitacao | void {
    
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
          // Solicitação criada com sucesso
        },
        error: (error) => {
          // Exibir erro ao usuário
          alert('Erro ao criar solicitação: ' + (error?.message || 'Falha desconhecida. Tente novamente.'));
        }
      });
    } else {
      // Criar apenas localmente (para compatibilidade com código existente)
      return this.criarSolicitacaoLocal(partial);
    }

    // Não retorna solicitação temporária se for integração com API
    return;
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

  updateStatus(id: string, status: SolicitacaoStatus, observacao?: string, dadosAprovacao?: any): void {
    // Tentar processar na nova API primeiro
    const idNumerico = parseInt(id);
    if (!isNaN(idNumerico)) {
      let request: any;
      if (status === 'pendente' && dadosAprovacao && dadosAprovacao.dadosPropostos) {
        // Para correção, enviar exatamente o objeto recebido (já está no formato correto)
        request = {
          observacoesSolicitacao: observacao,
          dadosPropostos: dadosAprovacao.dadosPropostos
        };
        // Se o objeto já veio pronto, use diretamente:
        if (Object.keys(dadosAprovacao).length === 2 && 'observacoesSolicitacao' in dadosAprovacao && 'dadosPropostos' in dadosAprovacao) {
          request = dadosAprovacao;
        }
      } else {
        // Fluxo antigo para aprovação/rejeição
        const acao = status === 'concluida' ? 'APROVAR' : 'REJEITAR';
        request = {
          acao,
          observacoesAprovacao: observacao
        };
        if (dadosAprovacao && Object.keys(dadosAprovacao).length > 0) {
          request.dadosAprovacao = dadosAprovacao;
        }
      }
      
      this.solicitacaoService.processarSolicitacao(idNumerico, request).subscribe({
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
  criarSolicitacaoExclusao(beneficiario: any, motivo: string, observacoes?: string, empresaId?: number): Observable<any> {
    const request: SolicitacaoRequest = {
      beneficiarioId: beneficiario.id,
      beneficiarioNome: typeof beneficiario.nome === 'string' && beneficiario.nome ? beneficiario.nome : (typeof beneficiario.benNomeSegurado === 'string' ? beneficiario.benNomeSegurado : ''),
      beneficiarioCpf: typeof beneficiario.cpf === 'string' && beneficiario.cpf ? beneficiario.cpf : (typeof beneficiario.benCpf === 'string' ? beneficiario.benCpf : ''),
      tipo: 'EXCLUSAO',
      motivoExclusao: typeof motivo === 'string' ? motivo : '',
      observacoesSolicitacao: typeof observacoes === 'string' ? observacoes : '',
      observacoesAprovacao: '',
      empresaId
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
      beneficiarioNome: typeof beneficiario.nome === 'string' && beneficiario.nome ? beneficiario.nome : (typeof beneficiario.benNomeSegurado === 'string' ? beneficiario.benNomeSegurado : ''),
      beneficiarioCpf: typeof beneficiario.cpf === 'string' && beneficiario.cpf ? beneficiario.cpf : (typeof beneficiario.benCpf === 'string' ? beneficiario.benCpf : ''),
      tipo: 'ALTERACAO',
      dadosPropostos: dadosPropostos,
      observacoesSolicitacao: typeof observacoes === 'string' ? observacoes : '',
      observacoesAprovacao: '',
      empresaId
    };
    return this.solicitacaoService.criarSolicitacao(request);
  }

  /**
   * Método helper para criar solicitação de inclusão de beneficiário
   */
  criarSolicitacaoInclusao(dadosPropostos: any, observacoes?: string): Observable<any> {
    // Se o parâmetro já é o objeto completo da solicitação, apenas repasse para o serviço
    // (mantém compatibilidade com chamadas antigas que passavam só dadosPropostos)
    if (dadosPropostos && typeof dadosPropostos === 'object' && 'beneficiarioNome' in dadosPropostos && 'beneficiarioCpf' in dadosPropostos) {
      return this.solicitacaoService.criarSolicitacao(dadosPropostos);
    }

    // Fluxo antigo: montar request a partir de dadosPropostos e observações
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    const request: SolicitacaoRequest = {
      tipo: 'INCLUSAO',
      empresaId: empresa?.id,
      beneficiarioNome: typeof dadosPropostos.benNomeSegurado === 'string' ? dadosPropostos.benNomeSegurado : '',
      beneficiarioCpf: typeof dadosPropostos.benCpf === 'string' ? dadosPropostos.benCpf : '',
      dadosPropostos: dadosPropostos,
      observacoesSolicitacao: typeof observacoes === 'string' ? observacoes : ''
      ,
      observacoesAprovacao: ''
    };
    return this.solicitacaoService.criarSolicitacao(request);
  }
 
}
