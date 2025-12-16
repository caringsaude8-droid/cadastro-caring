import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { SolicitacaoBeneficiarioService, SolicitacaoRequest } from './solicitacao-beneficiario.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresaContextService } from '../../../shared/services/empresa-context.service';
import { BeneficiariosService } from '../beneficiarios/beneficiarios.service';

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
  anexos?: any[];
}

@Injectable({ providedIn: 'root' })
export class AprovacaoService {
  private solicitacoesSubject = new BehaviorSubject<Solicitacao[]>([]);
  public solicitacoes$ = this.solicitacoesSubject.asObservable();
  private completarSubject = new BehaviorSubject<{ grupoId: string; count: number; solicitacaoId?: number | string } | null>(null);
  public completar$ = this.completarSubject.asObservable();

  constructor(
    private solicitacaoService: SolicitacaoBeneficiarioService,
    private authService: AuthService,
    private empresaContextService: EmpresaContextService,
    private beneficiariosService: BeneficiariosService
  ) {
    // Carregar solicitações iniciais
    this.atualizarSolicitacoes();
  }
  completarDependentesPorLote(grupoId: string, cpfTitular: string): void {
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    const empresaId = empresa?.id;
    if (!empresaId || !grupoId || !cpfTitular) return;
    
    this.beneficiariosService.listRaw().subscribe({
      next: (raw: any[]) => {
        const tit = raw.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpfTitular.replace(/\D/g, ''));
        if (!tit) {
          console.warn('[LoteCompletar] Titular não encontrado por CPF', { cpfTitular });
          return;
        }
        const titularId = tit.id;
        const matricula = tit.benMatricula || tit.matricula_beneficiario || '';
        if (titularId) {
          
          this.completarDependentesDoGrupo(grupoId, { titularId, cpfTitular: cpfTitular.replace(/\D/g, ''), matricula });
        }
      },
      error: () => {}
    });
  }
  forcarCompletarDependentes(solicitacao: Solicitacao, detalhes?: any): void {
    const obs = solicitacao.observacoesSolicitacao || solicitacao.observacao || '';
    const grupoId = this.extrairGrupoLoteId(obs);
    if (!grupoId) return;
    const cpfTitular = String(detalhes?.benTitularCpf || '').replace(/\D/g, '');
    if (!cpfTitular) return;
    this.beneficiariosService.listRaw().subscribe({
      next: (raw: any[]) => {
        const tit = raw.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpfTitular);
        if (tit) {
          const titularId = tit.id;
          const matricula = tit.benMatricula || tit.matricula_beneficiario || '';
          this.completarDependentesDoGrupo(grupoId, { titularId, cpfTitular, matricula });
        }
      },
      error: () => {}
    });
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
      if (status === 'pendente') {
        const request: any = {};
        if (observacao) request.observacoesSolicitacao = observacao;
        if (dadosAprovacao?.dadosPropostos) request.dadosPropostos = dadosAprovacao.dadosPropostos;
        if (dadosAprovacao?.anexos && Array.isArray(dadosAprovacao.anexos) && dadosAprovacao.anexos.length > 0) {
          request.anexos = dadosAprovacao.anexos;
        }
        this.solicitacaoService.atualizarSolicitacao(idNumerico, request).subscribe({
          next: () => {},
          error: () => {
            this.updateStatusLocal(id, status, observacao);
          }
        });
        return;
      }
      const acao = status === 'concluida' ? 'APROVAR' : 'REJEITAR';
      const request: any = { acao };
      if (observacao) request.observacoesAprovacao = observacao;
      if (dadosAprovacao) request.dadosAprovacao = dadosAprovacao;
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
   * Helper para atualizar dados propostos de dependente após titular aprovado
   */
  atualizarDadosPropostosDependente(solicitacaoId: string, dadosPropostos: any): Observable<any> {
    const idNumerico = parseInt(solicitacaoId);
    if (isNaN(idNumerico)) {
      return throwError(() => new Error('ID de solicitação inválido'));
    }
    const dadosJson = JSON.stringify(dadosPropostos);
    return this.solicitacaoService.atualizarDadosPropostos(idNumerico, dadosJson);
  }
  
  /**
   * Extrai o grupoLoteId do campo de observações usando o padrão [Lote:<UUID>]
   */
  private extrairGrupoLoteId(observacoes?: string): string | null {
    // Extrai o identificador de grupo de lote inserido nas observações, ex.: [Lote:123e4567-e89b-12d3-a456-426614174000]
    if (!observacoes) return null;
    const m = /\[Lote:([0-9a-fA-F\-]{8,})\]/.exec(observacoes);
    return m && m[1] ? m[1] : null;
  }
  /**
   * Gera UUID v4 para identificar grupo de lote
   */
  gerarGrupoLoteId(): string {
    // Gera um UUID v4 para identificar um grupo de lote entre titular e dependentes
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as any).randomUUID();
    }
    // Fallback simples
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  }
  /**
   * Persiste estado do lote no localStorage
   */
  private salvarLote(grupoId: string, data: any) {
    // Persiste informações do lote localmente (ids de solicitações, cpfs, marcadores de vinculação)
    localStorage.setItem(`lote:${grupoId}`, JSON.stringify(data));
  }
  private carregarLote(grupoId: string): any | null {
    // Recupera informações do lote do localStorage
    try {
      const raw = localStorage.getItem(`lote:${grupoId}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  iniciarLote(grupoId: string, cpfTitular: string) {
    // Inicializa estrutura do lote para um grupo: cpf do titular, arrays de dependentes e vínculos
    const data = this.carregarLote(grupoId) || {};
    data.cpfTitular = cpfTitular.replace(/\D/g, '');
    data.dependentesIds = Array.isArray(data.dependentesIds) ? data.dependentesIds : [];
    data.vinculados = Array.isArray(data.vinculados) ? data.vinculados : [];
    this.salvarLote(grupoId, data);
  }
  registrarSolicitacaoTitular(grupoId: string, solicitacaoId: number) {
    // Registra a solicitação do titular dentro do estado do lote
    const data = this.carregarLote(grupoId) || {};
    data.solicitacaoTitularId = solicitacaoId;
    this.salvarLote(grupoId, data);
  }
  registrarSolicitacaoDependente(grupoId: string, solicitacaoId: number) {
    // Registra uma solicitação de dependente dentro do estado do lote
    const data = this.carregarLote(grupoId) || {};
    const ids: number[] = Array.isArray(data.dependentesIds) ? data.dependentesIds : [];
    if (!ids.includes(solicitacaoId)) ids.push(solicitacaoId);
    data.dependentesIds = ids;
    this.salvarLote(grupoId, data);
  }
  marcarDependenteVinculado(grupoId: string, solicitacaoId: number) {
    // Marca que a solicitação do dependente já foi vinculada para garantir idempotência
    const data = this.carregarLote(grupoId) || {};
    const vinc: number[] = Array.isArray(data.vinculados) ? data.vinculados : [];
    if (!vinc.includes(solicitacaoId)) vinc.push(solicitacaoId);
    data.vinculados = vinc;
    this.salvarLote(grupoId, data);
  }
  /**
   * Calcula código numérico de benRelacaoDep com base em faixa, sexo e códigos usados
   */
  private calcularCodigoRelacaoDep(categoria: string, sexo: string, usados: number[]): number | null {
    // Calcula o código de benRelacaoDep com base na categoria e sexo, respeitando faixas livres e códigos já usados
    const cat = (categoria || '').toLowerCase();
    const isM = (sexo || '').toUpperCase() === 'M';
    const faixa = (base: number, max: number): number | null => {
      for (let c = base; c <= max; c++) {
        if (!usados.includes(c)) return c;
      }
      return null;
    };
    const fixos: Record<string, number> = {
      'esposa': 1, 'companheira': 2, 'companheiro': 2, 'marido': 9,
      'pai': 50, 'mae': 51, 'sogro': 52, 'sogra': 53
    };
    if (fixos[cat] !== undefined) return fixos[cat];
    switch (cat) {
      case 'menor_guarda_tutela': return faixa(5, 8);
      case 'filho': return isM ? faixa(10, 20) : faixa(30, 40);
      case 'filho_maior': return isM ? faixa(21, 25) : faixa(41, 45);
      case 'filha': return faixa(30, 40);
      case 'filha_maior': return faixa(41, 45);
      case 'dependente_legal': return faixa(60, 69);
      case 'filho_adotivo': return isM ? faixa(70, 74) : faixa(75, 79);
      case 'filha_adotiva': return faixa(75, 79);
      case 'irmao': return isM ? faixa(80, 84) : faixa(85, 89);
      case 'irma': return faixa(85, 89);
      case 'outros': return isM ? faixa(90, 94) : faixa(95, 99);
      default: return null;
    }
  }
  /**
   * Rotina principal de completar dependentes de um grupo
   */
  private completarDependentesDoGrupo(grupoId: string, titular: { titularId: number; cpfTitular: string; matricula: string }) {
    
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    const empresaId = empresa?.id;
    if (!empresaId) return;
    this.solicitacaoService.listarTodasPorEmpresa(empresaId).subscribe({
      next: (lista) => {
        const loteData = this.carregarLote(grupoId) || {};
        const dependentesIds: number[] = Array.isArray(loteData.dependentesIds) ? loteData.dependentesIds : [];
        const todosDoGrupo = (lista || []).filter(s => {
          const obs = s.observacoesSolicitacao || s.observacoes || '';
          const gid = this.extrairGrupoLoteId(obs);
          return gid === grupoId;
        });
        
        const pendentesMesmoGrupo = (lista || []).filter(s => {
          const obs = s.observacoesSolicitacao || s.observacoes || '';
          const gid = this.extrairGrupoLoteId(obs);
          if (gid !== grupoId) return false;
          if ((s.status || 'PENDENTE') !== 'PENDENTE') return false;
          try {
            const dj = s.dadosJson ? JSON.parse(s.dadosJson) : null;
            const dp = dj?.dadosPropostos || dj;
            const rel = String(dp?.benRelacaoDep || '').trim();
            return rel !== '00';
          } catch {
            console.warn('[LoteCompletar] dadosJson ausente ou inválido para solicitação', { solicitacaoId: s.id });
            return false;
          }
        });
        
        const usados: number[] = (lista || []).flatMap(s => {
          try {
            const dj = s.dadosJson ? JSON.parse(s.dadosJson) : null;
            const dp = dj?.dadosPropostos || dj;
            const isMesmoTitular = (dp?.benTitularId && dp.benTitularId === titular.titularId) || ((dp?.benTitularCpf || '').replace(/\D/g, '') === titular.cpfTitular);
            if (!isMesmoTitular) return [];
            const relNum = parseInt(String(dp?.benRelacaoDep || '0'), 10);
            return isNaN(relNum) ? [] : [relNum];
          } catch { return []; }
        });
        
        if (dependentesIds.length > 0) {
          dependentesIds.forEach(idNum => {
            if (typeof idNum !== 'number' || isNaN(idNum)) return;
            this.solicitacaoService.buscarPorId(idNum).subscribe({
              next: (s) => {
                const obs = s.observacoesSolicitacao || s.observacoes || '';
                const gid = this.extrairGrupoLoteId(obs);
                if (gid !== grupoId) return;
                const statusOk = String(s.status || 'PENDENTE').toUpperCase() === 'PENDENTE';
                if (!statusOk) return;
                let dj: any = null;
                let dp: any = {};
                try {
                  dj = s?.dadosJson ? JSON.parse(s.dadosJson) : null;
                  dp = dj?.dadosPropostos || dj || {};
                } catch { dp = {}; }
                const rel = String(dp?.benRelacaoDep || '').trim();
                if (rel === '00') return;
                if ((dp?.benTitularId && dp?.benRelacaoDep)) return;
                const vinculadosLocal: number[] = Array.isArray(loteData.vinculados) ? loteData.vinculados : [];
                if (vinculadosLocal.includes(idNum)) return;
                const categoria = dp?.benRelacaoDepLabel || dp?.relacaoDep || '';
                const sexo = dp?.benSexo || '';
                const codigo = this.calcularCodigoRelacaoDep(categoria, sexo, usados);
                if (codigo === null) return;
                usados.push(codigo);
                const dpSanitized = { ...dp };
                delete (dpSanitized as any).vinculoOk;
                delete (dpSanitized as any).benRelacaoDepLabel;
                delete (dpSanitized as any).relacaoDep;
                delete (dpSanitized as any).benTitularCpf;
                const dadosPropostosAtualizados: any = {
                  ...dpSanitized,
                  benTitularId: titular.titularId,
                  benRelacaoDep: String(codigo).padStart(2, '0')
                };
                if (titular.matricula) dadosPropostosAtualizados.benMatricula = titular.matricula;
                const body = JSON.stringify(dadosPropostosAtualizados);
                
                this.solicitacaoService.atualizarDadosPropostos(idNum, body).subscribe({
                  next: () => {
                    this.marcarDependenteVinculado(grupoId, idNum);
                    this.completarSubject.next({ grupoId, count: 1, solicitacaoId: idNum });
                    
                  },
                  error: () => {}
                });
              },
              error: () => {}
            });
          });
        }
        const candidatosRemotosBase = (lista || []).filter(s => {
          const t = String(s.tipo || '').toUpperCase() === 'INCLUSAO';
          const statusOk = String(s.status || 'PENDENTE').toUpperCase() === 'PENDENTE';
          return t && statusOk;
        });
        candidatosRemotosBase.forEach(s0 => {
          const idAny = s0.id as any;
          const idNum = typeof idAny === 'number' ? idAny : parseInt(String(idAny || '0'), 10);
          if (isNaN(idNum)) return;
          this.solicitacaoService.buscarPorId(idNum).subscribe({
            next: (det) => {
              const obsRemote = det?.observacoesSolicitacao || det?.observacoes || '';
              const gidRemote = this.extrairGrupoLoteId(obsRemote);
              if (gidRemote !== grupoId) return;
              let dj: any = null;
              let dp: any = {};
              try {
                dj = det?.dadosJson ? JSON.parse(det.dadosJson) : null;
                dp = dj?.dadosPropostos || dj || {};
              } catch { dp = {}; }
              const rel = String(dp?.benRelacaoDep || '').trim();
              if (rel === '00') return;
              const loteDataLocal = this.carregarLote(grupoId) || {};
              const vinculadosLocal: number[] = Array.isArray(loteDataLocal.vinculados) ? loteDataLocal.vinculados : [];
              if (vinculadosLocal.includes(idNum)) return;
              const categoria = dp?.benRelacaoDepLabel || dp?.relacaoDep || '';
              const sexo = dp?.benSexo || '';
              const codigo = this.calcularCodigoRelacaoDep(categoria, sexo, usados);
              if (codigo === null) return;
              usados.push(codigo);
              const dpSanitized = { ...dp };
              delete (dpSanitized as any).vinculoOk;
              delete (dpSanitized as any).benRelacaoDepLabel;
              delete (dpSanitized as any).relacaoDep;
              delete (dpSanitized as any).benTitularCpf;
              const dadosPropostosAtualizados: any = {
                ...dpSanitized,
                benTitularId: titular.titularId,
                benRelacaoDep: String(codigo).padStart(2, '0')
              };
              if (titular.matricula) dadosPropostosAtualizados.benMatricula = titular.matricula;
              const body = JSON.stringify(dadosPropostosAtualizados);
              
              this.solicitacaoService.atualizarDadosPropostos(idNum, body).subscribe({
                next: () => {
                  this.marcarDependenteVinculado(grupoId, idNum);
                  this.completarSubject.next({ grupoId, count: 1 });
                  
                },
                error: () => {}
              });
            },
            error: () => {}
          });
        });
        // Atualizar cada dependente
        pendentesMesmoGrupo.forEach(s => {
          const id = s.id || 0;
          // Idempotência: pular se já vinculado
          const dj = s.dadosJson ? JSON.parse(s.dadosJson) : null;
          const dp = dj?.dadosPropostos || dj || {};
          // Se já possui vínculo definido, não processar novamente
          if ((dp?.benTitularId && dp?.benRelacaoDep)) return;
          // Idempotência por estado local do lote
          const loteData = this.carregarLote(grupoId) || {};
          const vinculados: number[] = Array.isArray(loteData.vinculados) ? loteData.vinculados : [];
          if (vinculados.includes(id)) return;
          const categoria = dp?.benRelacaoDepLabel || dp?.relacaoDep || '';
          const sexo = dp?.benSexo || '';
          const codigo = this.calcularCodigoRelacaoDep(categoria, sexo, usados);
          if (codigo === null) {
            console.warn('[LoteCompletar] Faixa saturada para categoria', { categoria });
            return;
          }
          usados.push(codigo);
          // Sanitizar: remover campos técnicos/auxiliares antes de enviar
          const dpSanitized = { ...dp };
          delete (dpSanitized as any).vinculoOk;
          delete (dpSanitized as any).benRelacaoDepLabel;
          delete (dpSanitized as any).relacaoDep;
          delete (dpSanitized as any).benTitularCpf;
          // Montar somente o objeto de dadosPropostos esperado pela API
          const dadosPropostosAtualizados: any = {
            ...dpSanitized,
            benTitularId: titular.titularId,
            benRelacaoDep: String(codigo).padStart(2, '0')
          };
          if (titular.matricula) dadosPropostosAtualizados.benMatricula = titular.matricula;
              const body = JSON.stringify(dadosPropostosAtualizados);
              
              this.solicitacaoService.atualizarDadosPropostos(id, body).subscribe({
                next: () => {
                  this.marcarDependenteVinculado(grupoId, id);
                  this.completarSubject.next({ grupoId, count: 1, solicitacaoId: id });
                  
                },
                error: (error) => {
                  console.error('Erro ao atualizar dependente do lote', error);
                }
          });
        });
      },
      error: () => {}
    });
  }

  /**
   * Método helper para criar solicitação de exclusão de beneficiário
   */
  criarSolicitacaoExclusao(beneficiario: any, motivo: string, observacoes?: string, empresaId?: number): Observable<any> {
    // Helper para criar solicitação de exclusão no novo endpoint
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
    empresaId?: number,
    anexos?: { nomeOriginal: string; base64: string; tipoMime: string; tamanho: number }[]
  ): Observable<any> {
    // Helper para criar solicitação de alteração no novo endpoint
    const request: SolicitacaoRequest = {
      beneficiarioId: beneficiario.id,
      beneficiarioNome: typeof beneficiario.nome === 'string' && beneficiario.nome ? beneficiario.nome : (typeof beneficiario.benNomeSegurado === 'string' ? beneficiario.benNomeSegurado : ''),
      beneficiarioCpf: typeof beneficiario.cpf === 'string' && beneficiario.cpf ? beneficiario.cpf : (typeof beneficiario.benCpf === 'string' ? beneficiario.benCpf : ''),
      tipo: 'ALTERACAO',
      dadosPropostos: dadosPropostos,
      observacoesSolicitacao: typeof observacoes === 'string' ? observacoes : '',
      observacoesAprovacao: '',
      empresaId,
      anexos: Array.isArray(anexos) ? anexos : undefined
    };
    return this.solicitacaoService.criarSolicitacao(request);
  }

  /**
   * Método helper para criar solicitação de inclusão de beneficiário
   */
  criarSolicitacaoInclusao(dadosPropostos: any, observacoes?: string): Observable<any> {
    // Helper para criar solicitação de inclusão no novo endpoint; aceita objeto completo ou monta a partir de dadosPropostos
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
