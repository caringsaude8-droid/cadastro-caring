import { Injectable } from '@angular/core';

export type SolicitacaoStatus = 'pendente' | 'concluida';
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
}

@Injectable({ providedIn: 'root' })
export class AprovacaoService {
  private solicitacoes: Solicitacao[] = [];

  list(): Solicitacao[] {
    return this.solicitacoes;
  }

  add(partial: Omit<Solicitacao, 'id' | 'data' | 'status'> & { status?: SolicitacaoStatus; data?: string }): Solicitacao {
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
      observacao: partial.observacao
    };
    this.solicitacoes.unshift(s);
    return s;
  }

  updateStatus(id: string, status: SolicitacaoStatus, observacao?: string): void {
    const idx = this.solicitacoes.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.solicitacoes[idx] = { ...this.solicitacoes[idx], status, observacao };
    }
  }
}
