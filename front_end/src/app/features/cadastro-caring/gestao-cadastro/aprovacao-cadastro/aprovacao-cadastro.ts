import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { AprovacaoService, Solicitacao } from '../aprovacao.service';
import { BeneficiariosService } from '../../beneficiarios/beneficiarios.service';
import { SolicitacaoBeneficiarioService } from '../solicitacao-beneficiario.service';

type Anexo = { tipo: string; nome: string; size: number; dataUrl: string };

@Component({
  selector: 'app-aprovacao-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './aprovacao-cadastro.html',
  styleUrl: './aprovacao-cadastro.css'
})
export class AprovacaoCadastroComponent {
  filtroTipo = '';
  filtroStatus = '';
  termo = '';
  showDetails = false;
  selected: Solicitacao | null = null;
  observacaoAprovacao: string = '';
  anexosSelecionado: Anexo[] = [];
  carregando = false;
  dadosDetalhes: any = null;
  showInclusaoDetails = false;
  historicoCompleto: { valorNovo: string; usuarioNome: string; dataOperacao: string }[] = [];

  showBenefDetails = false;
  benefDetalhes: any = null;
  showToastMessage = false;
  toastMessage = '';

  // Modal de aprovação para inclusão
  showApprovalModal = false;
  approvalSolicitacao: Solicitacao | null = null;
  dadosAprovacao = {
    benCodCartao: '',
    benCodUnimedSeg: ''
  };
  showRejectModal = false;
  rejectSolicitacao: Solicitacao | null = null;

  constructor(private aprovacao: AprovacaoService, private beneficiarios: BeneficiariosService, private solicitacoesService: SolicitacaoBeneficiarioService) {
    // Carregar todas as solicitações ao inicializar
    this.aprovacao.atualizarSolicitacoes();
    this.aprovacao.completar$.subscribe(ev => {
      if (!ev) return;
      this.toastMessage = `${ev.count} dependente completado (lote ${ev.grupoId})`;
      this.showToastMessage = true;
      setTimeout(() => { this.showToastMessage = false; }, 2000);
      const evIdAny: any = ev.solicitacaoId;
      const evIdNum = typeof evIdAny === 'number' ? evIdAny : parseInt(String(evIdAny || '0'), 10);
      if (this.selected && !isNaN(evIdNum)) {
        const selIdNum = parseInt(String(this.selected.id || '0'), 10);
        if (!isNaN(selIdNum) && selIdNum === evIdNum) {
          this.solicitacoesService.buscarPorId(evIdNum).subscribe({
            next: (det: any) => {
              try {
                const raw = det?.dadosJson ? JSON.parse(det.dadosJson) : null;
                const dp = raw?.dadosPropostos ?? raw ?? {};
                this.dadosDetalhes = dp;
                const newSelected: any = { ...this.selected };
                newSelected.dadosJson = det?.dadosJson;
                this.selected = newSelected;
              } catch {}
            },
            error: () => {}
          });
        }
      }
    });
  }

  get lista(): Solicitacao[] {
    const filtered = this.aprovacao.list().filter(s => {
      const mt = !this.filtroTipo || s.tipo === this.filtroTipo;
      const ms = !this.filtroStatus || s.status === this.filtroStatus as any;
      const needle = (this.termo || '').trim().toLowerCase();
      const ndigits = needle.replace(/\D/g, '');
      const base = `${s.identificador} ${s.descricao} ${s.solicitante} ${s.codigoEmpresa || ''}`.toLowerCase();
      const idNorm = String(s.identificador || '').replace(/\D/g, '');
      const dRaw = String(s.data || '').toLowerCase();
      const dt = (() => { try { const d = new Date(s.data as any); if (isNaN(d.getTime())) return ''; const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`.toLowerCase(); } catch { return ''; } })();
      const tt = !needle || base.includes(needle) || (!!ndigits && idNorm.includes(ndigits)) || dRaw.includes(needle) || (!!dt && dt.includes(needle));
      return mt && ms && tt;
    });

    
    // Ordenar solicitações por data (nova para velha)
    const toTime = (d: any): number => {
      try {
        if (!d) return 0;
        if (d instanceof Date) return d.getTime();
        if (typeof d === 'string') {
          const dt = new Date(d);
          return isNaN(dt.getTime()) ? 0 : dt.getTime();
        }
        if (typeof d === 'number') return d;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? 0 : dt.getTime();
      } catch { return 0; }
    };
    return filtered.sort((a, b) => toTime(b.data) - toTime(a.data));
  }

  // Ao aprovar inclusão, abre modal para permitir preencher códigos adicionais (cartão, unimed)
  aprovar(id: string) {
    const s = this.aprovacao.list().find(x => x.id === id);
    if (!s) return;
    
    // Se for inclusão, abrir modal para preencher dados adicionais
    if (s.tipo === 'inclusao') {
      this.approvalSolicitacao = s;
      this.dadosAprovacao = {
        benCodCartao: '',
        benCodUnimedSeg: ''
      };
      const idNum = parseInt(s.id);
      if (!isNaN(idNum)) {
        this.solicitacoesService.buscarPorId(idNum).subscribe({
          next: (resp: any) => {
            try {
              const dadosObj = resp?.dadosJson ? JSON.parse(resp.dadosJson) : null;
              const propostos = dadosObj && dadosObj.dadosPropostos ? dadosObj.dadosPropostos : dadosObj;
              if (propostos) {
                this.dadosAprovacao.benCodCartao = propostos.benCodCartao || this.dadosAprovacao.benCodCartao;
                this.dadosAprovacao.benCodUnimedSeg = propostos.benCodUnimedSeg || this.dadosAprovacao.benCodUnimedSeg;
              }
            } catch {}
          },
          error: () => {}
        });
      }
      this.showApprovalModal = true;
      return;
    }
    
    // Para outros tipos, aprovar diretamente
    this.processarAprovacao(id);
  }

  // Processa aprovação chamando o serviço e, para inclusão, ativa o beneficiário e dispara completar dependentes do lote
  processarAprovacao(id: string, dadosAdicionais?: any) {
    const s = this.aprovacao.list().find(x => x.id === id);
    
    // Passar dadosAdicionais para o método updateStatus
    this.aprovacao.updateStatus(id, 'concluida', this.observacaoAprovacao || undefined, dadosAdicionais);
    if (!s) return;
    if (s.entidade === 'beneficiario' && s.identificador) {
      if (s.tipo === 'inclusao') {
        // Para inclusão aprovada, buscar beneficiário (inclui pendentes/raw) e ativar
        const cpfId = (s.identificador || '').replace(/\D/g, '');
        const aplicarAtualizacao = (id: number) => {
          const updatePayload: any = { benStatus: 'ATIVO' };
          if (dadosAdicionais?.benCodCartao) updatePayload.benCodCartao = dadosAdicionais.benCodCartao;
          if (dadosAdicionais?.benCodUnimedSeg) updatePayload.benCodUnimedSeg = dadosAdicionais.benCodUnimedSeg;
          this.beneficiarios.alterarBeneficiario(id, updatePayload).subscribe({
            next: () => {},
            error: (error) => console.error('❌ Erro ao ativar beneficiário:', error)
          });
        };
        // Primeiro tenta via list() (mapeado)
        this.beneficiarios.buscarPorFiltros({ cpf: s.identificador }).subscribe({
          next: (beneficiarios) => {
            const m = beneficiarios.find(b => (b.cpf || '').replace(/\D/g, '') === cpfId);
            if (m?.id) {
              aplicarAtualizacao(m.id);
              const obs = (s.observacoesSolicitacao || (s as any).observacao || '') as string;
              void obs;
              return;
            }
            // Fallback: usa listRaw para garantir que encontre o registro recém-criado
            this.beneficiarios.listRaw().subscribe({
              next: (lista: any[]) => {
                const raw = lista.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpfId);
                if (raw?.id) {
                  aplicarAtualizacao(raw.id);
                  const obs = (s.observacoesSolicitacao || (s as any).observacao || '') as string;
                  void obs;
                } else {
                  // Tenta novamente após pequeno delay (processamento de back-end)
                  setTimeout(() => {
                    this.beneficiarios.listRaw().subscribe({
                      next: (lista2: any[]) => {
                        const raw2 = lista2.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpfId);
                        if (raw2?.id) {
                          aplicarAtualizacao(raw2.id);
                          const obs = (s.observacoesSolicitacao || (s as any).observacao || '') as string;
                          void obs;
                        }
                        else console.warn('⚠️ Beneficiário não encontrado após aprovação:', s.identificador);
                      },
                      error: (e) => console.error('❌ Erro no fallback listRaw:', e)
                    });
                  }, 800);
                }
              },
              error: (error) => console.error('❌ Erro ao buscar beneficiário (raw) para aprovação:', error)
            });
          },
          error: (error) => console.error('❌ Erro ao buscar beneficiário para aprovação:', error)
        });
      } else if (s.tipo === 'alteracao') {
        // Para alteração: obter dados propostos da solicitação e persistir os códigos
        const idNum = parseInt(s.id);
        if (!isNaN(idNum)) {
          this.solicitacoesService.buscarPorId(idNum).subscribe({
            next: (resp: any) => {
              try {
                const dadosObj = resp?.dadosJson ? JSON.parse(resp.dadosJson) : null;
                const propostos = dadosObj && dadosObj.dadosPropostos ? dadosObj.dadosPropostos : dadosObj;
                // Buscar beneficiário por CPF
                const cpf = (s.identificador || '').replace(/\D/g, '');
                this.beneficiarios.buscarPorFiltros({ cpf }).subscribe({
                  next: (beneficiarios) => {
                    const beneficiario = beneficiarios.find(b => (b.cpf || '').replace(/\D/g, '') === cpf);
                    if (beneficiario) {
                      const updatePayload: any = {};
                      // Preferir códigos informados como dadosAdicionais (dadosAprovacao), senão usar propostos
                      const fonte = dadosAdicionais && Object.keys(dadosAdicionais).length > 0 ? dadosAdicionais : propostos;
                      if (fonte?.benCodCartao) updatePayload.benCodCartao = fonte.benCodCartao;
                      if (fonte?.benCodUnimedSeg) updatePayload.benCodUnimedSeg = fonte.benCodUnimedSeg;
                      if (propostos?.benTitularId) updatePayload.benTitularId = propostos.benTitularId;
                      if (propostos?.benMotivoExclusao) updatePayload.benMotivoExclusao = propostos.benMotivoExclusao;
                      // Persistir alterações de códigos
                      if (Object.keys(updatePayload).length > 0) {
                        this.beneficiarios.alterarBeneficiario(beneficiario.id, updatePayload).subscribe({
                          next: () => {},
                          error: (error) => console.error('❌ Erro ao atualizar códigos na alteração:', error)
                        });
                      }
                    }
                  },
                  error: (error) => console.error('❌ Erro ao buscar beneficiário para alteração:', error)
                });
              } catch {}
            },
            error: () => {}
          });
        }
      } else if (s.tipo === 'exclusao') {
        // Para exclusão, buscar o beneficiário e processar exclusão via API
        this.beneficiarios.buscarPorFiltros({ cpf: s.identificador }).subscribe({
          next: (beneficiarios) => {
            const beneficiario = beneficiarios.find(b => b.cpf === s.identificador || b.matricula_beneficiario === s.identificador);
            if (beneficiario) {
              try {
                const raw = localStorage.getItem('beneficiariosStatus');
                const store = raw ? JSON.parse(raw) as Record<string, { status: string; motivo: string; dataExclusao?: string }> : {};
                const entry = store[beneficiario.matricula_beneficiario];
                const motivo = entry?.motivo || 'RESCISAO';
                
                // Excluir via API
                this.beneficiarios.excluirBeneficiario(beneficiario.id, motivo).subscribe({
                  next: () => {},
                  error: (error) => console.error('❌ Erro ao excluir beneficiário:', error)
                });
              } catch (error) {
                console.error('❌ Erro ao processar dados de exclusão:', error);
                // Fallback: exclusão com motivo padrão
                this.beneficiarios.excluirBeneficiario(beneficiario.id, 'RESCISAO').subscribe({
                  next: () => {},
                  error: (error) => console.error('❌ Erro ao excluir beneficiário (fallback):', error)
                });
              }
            }
          },
          error: (error) => console.error('❌ Erro ao buscar beneficiário para exclusão:', error)
        });
      }
    }
  }

  pendente(id: string) {
    const s = this.aprovacao.list().find(x => x.id === id);
    this.aprovacao.updateStatus(id, 'pendente');
    if (s && s.entidade === 'beneficiario' && s.identificador) {
      // Buscar beneficiário e marcar como pendente via API
      this.beneficiarios.buscarPorFiltros({ cpf: s.identificador }).subscribe({
        next: (beneficiarios) => {
          const beneficiario = beneficiarios.find(b => b.cpf === s.identificador);
          if (beneficiario) {
            // Atualizar status para 'Pendente' via API de alteração
            this.beneficiarios.alterarBeneficiario(beneficiario.id, { benStatus: 'Pendente' }).subscribe({
              next: () => {},
              error: (error) => console.error('❌ Erro ao marcar como pendente:', error)
            });
          }
        },
        error: (error) => console.error('❌ Erro ao buscar beneficiário:', error)
      });
    }
  }

  // Abre modal de detalhes da solicitação; carrega histórico e normaliza datas para o DatePipe
  openDetails(s: Solicitacao) {
    this.selected = s;
    this.observacaoAprovacao = '';
    this.dadosDetalhes = s?.dadosPropostos || null;
    this.showInclusaoDetails = false;
    this.historicoCompleto = [];
    this.enriquecerTitularInfo();
    this.enriquecerStatusInclusao();
    try {
      const saved = localStorage.getItem(`solicitacaoAjustes:${s.id}`);
      const parsed = saved ? JSON.parse(saved) : null;
      this.anexosSelecionado = parsed?.anexos || [];
    } catch { this.anexosSelecionado = []; }
    this.showDetails = true;
    const idNum = parseInt(s.id);
    if (!isNaN(idNum)) {
      
      this.solicitacoesService.listarHistorico(idNum).subscribe({
        next: (lista: any[]) => {
          try {
            
            const toIso = (d: any): string => {
              try {
                if (!d) return new Date().toISOString();
                if (d instanceof Date) return d.toISOString();
                if (typeof d === 'string') {
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
                  const dt = new Date(d);
                  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
                }
                if (typeof d === 'number') return new Date(d).toISOString();
                const dt = new Date(d);
                return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
              } catch { return new Date().toISOString(); }
            };
            const m = (e: any) => ({
              valorNovo: String(e?.valorNovo ?? ''),
              usuarioNome: String(e?.usuarioNome ?? ''),
              dataOperacao: toIso(e?.dataOperacao)
            });
            const mapped = Array.isArray(lista) ? lista.map(m) : [];
            this.historicoCompleto = mapped.sort((a, b) => new Date(b.dataOperacao).getTime() - new Date(a.dataOperacao).getTime());
            
          } catch {}
        },
        error: () => {}
      });
      this.solicitacoesService.buscarPorId(idNum).subscribe({
        next: (resp: any) => {
          try {
            const dadosObj = resp?.dadosJson ? JSON.parse(resp.dadosJson) : null;
            const propostos = dadosObj && dadosObj.dadosPropostos ? dadosObj.dadosPropostos : dadosObj;
            this.dadosDetalhes = propostos || this.dadosDetalhes;
            this.enriquecerTitularInfo();

            
          } catch {}
        },
        error: () => {}
    });
    }
  }

  private enriquecerStatusInclusao() {
    try {
      const cpf = String(this.dadosDetalhes?.benCpf || this.selected?.identificador || '').replace(/\D/g, '');
      if (!cpf) return;
      this.beneficiarios.listRaw().subscribe({
        next: (lista: any[]) => {
          const b = lista.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpf);
          if (b) {
            const status = b.benStatus || 'ATIVO';
            const matricula = b.benMatricula || b.matricula_beneficiario || '';
            const d = this.dadosDetalhes || {};
            const rel = String(d?.benRelacaoDep || '').trim();
            const lbl = String(d?.benRelacaoDepLabel || '').toLowerCase();
            const isDependente = rel !== '00' && lbl !== 'titular';
            const mergeCodes = !isDependente || this.selected?.status === 'concluida';
            const codUnimed = mergeCodes ? (b.benCodUnimedSeg || b.cod_unimed_seg || '') : (d.benCodUnimedSeg || '');
            const codCartao = mergeCodes ? (b.benCodCartao || b.cod_cartao || '') : (d.benCodCartao || '');
            this.dadosDetalhes = { 
              ...d,
              benStatus: status,
              benMatricula: d.benMatricula || matricula,
              benCodUnimedSeg: codUnimed,
              benCodCartao: codCartao
            };
          } else if (this.selected?.status === 'concluida' && this.dadosDetalhes) {
            this.dadosDetalhes = { ...this.dadosDetalhes, benStatus: 'ATIVO' };
          }
        },
        error: () => {}
      });
    } catch {}
  }

  // Quando a inclusão é de dependente, enriquece dados do titular (nome/cpf) via listRaw pelo benTitularId
  private async enriquecerTitularInfo() {
    try {
      const d = this.dadosDetalhes as any;
      if (!d) return;
      const isTitular = String(d.benRelacaoDep || '').trim() === '00';
      if (isTitular) return;
      const titularId = d.benTitularId;
      if ((!d.benTitularNome || !d.benTitularCpf) && titularId) {
        const raw = await this.beneficiarios.listRaw().toPromise();
        const titular = raw?.find(b => b.id === titularId);
        if (titular) {
          d.benTitularNome = titular.nome || titular.benNomeSegurado || '';
          d.benTitularCpf = titular.cpf || titular.benCpf || '';
          this.dadosDetalhes = { ...d };
        }
      }
    } catch {}
  }

  closeDetails() {
    this.showDetails = false;
    this.selected = null;
    this.observacaoAprovacao = '';
    this.showInclusaoDetails = false;
  }

  openInclusaoDetails() {
    if (this.selected?.tipo === 'inclusao') {
      this.showInclusaoDetails = true;
    }
  }

  closeInclusaoDetails() {
    this.showInclusaoDetails = false;
  }

  openBenefDetails() {
    const cpf = (this.selected?.identificador || '').replace(/\D/g, '');
    if (!cpf) return;
    this.beneficiarios.listRaw().subscribe({
      next: (lista: any[]) => {
        const b = lista.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpf);
        if (b) {
          const codUnimed = b.benCodUnimedSeg || b.cod_unimed_seg || '';
          const codCartao = b.benCodCartao || b.cod_cartao || '';
          this.benefDetalhes = {
            nome: b.benNomeSegurado || b.nome || '',
            cpf: b.benCpf || b.cpf || '',
            nascimento: b.benDtaNasc || b.nascimento || '',
            benStatus: b.benStatus || 'Ativo',
            matricula: b.benMatricula || b.matricula_beneficiario || '',
            endereco: b.benEndereco || b.endereco || '',
            numero: b.benNumero || b.numero || '',
            complemento: b.benComplemento || b.complemento || '',
            bairro: b.benBairro || b.bairro || '',
            cep: b.benCep || b.cep || '',
            celular: b.benDddCel || b.celular || '',
            email: b.benEmail || b.email || '',
            planoProd: b.benPlanoProd || b.plano_prod || '',
            admissao: b.benAdmissao || b.admissao || '',
            benCodUnimedSeg: codUnimed,
            benCodCartao: codCartao
          };
          this.showBenefDetails = true;
        }
      },
      error: () => {}
    });
  }

  closeBenefDetails() {
    this.showBenefDetails = false;
    this.benefDetalhes = null;
  }

  confirmarAprovacao() {
    if (!this.approvalSolicitacao) return;
    if (!this.podeAprovarConfirmacao()) {
      alert('Relação de dependência ausente para dependente em modo lote. Aprove o titular primeiro.');
      return;
    }
    
    // Criar objeto com dados adicionais para aprovação
    const dadosAprovacao: any = {};
    
    if (this.dadosAprovacao.benCodCartao) {
      dadosAprovacao.benCodCartao = this.dadosAprovacao.benCodCartao;
    }
    if (this.dadosAprovacao.benCodUnimedSeg) {
      dadosAprovacao.benCodUnimedSeg = this.dadosAprovacao.benCodUnimedSeg;
    }
    
    // Processar aprovação com dados adicionais
    this.processarAprovacao(this.approvalSolicitacao.id, dadosAprovacao);
    // Fechar modal
    this.closeApprovalModal();
    this.closeDetails();
    this.atualizarLista();
    this.refreshAfterAction();
    this.observacaoAprovacao = '';
  }

  closeApprovalModal() {
    this.showApprovalModal = false;
    this.approvalSolicitacao = null;
    this.dadosAprovacao = {
      benCodCartao: '',
      benCodUnimedSeg: ''
    };
  }
  closeRejectModal() {
    this.showRejectModal = false;
    this.rejectSolicitacao = null;
  }
  // Modal de confirmação para negar; atualiza status para 'aguardando' e registra histórico local
  confirmarNegacao() {
    if (!this.rejectSolicitacao) return;
    this.aprovacao.updateStatus(this.rejectSolicitacao.id, 'aguardando', this.observacaoAprovacao || '');
    if (!this.rejectSolicitacao.historico) this.rejectSolicitacao.historico = [];
    this.rejectSolicitacao.historico.push({
      data: new Date().toISOString(),
      status: 'aguardando',
      observacao: this.observacaoAprovacao || 'Negação sem observação.'
    });
    this.closeRejectModal();
    this.closeDetails();
    this.atualizarLista();
    this.observacaoAprovacao = '';
  }

  aceitarSelecionado() {
    if (!this.selected || this.selected.status === 'concluida') return;
    if (!this.podeAprovarSelecionado()) return;
    this.aprovar(this.selected.id);
  }

  // Abre modal de confirmação de negação; evita cliques acidentais
  negarSelecionado() {
    if (!this.selected || this.selected.status === 'concluida') return;
    this.rejectSolicitacao = this.selected;
    this.showRejectModal = true;
  }
  // bloqueia o aceite de dependente sem relação dep.
  // Obtém o código benRelacaoDep da inclusão selecionada a partir de dadosPropostos/dadosJson
  private obterRelacaoDepDaSelecionada(): string {
    try {
      const rel = String(this.dadosDetalhes?.benRelacaoDep ?? '').trim();
      if (rel) return rel;
      const raw = this.selected?.dadosJson;
      if (raw) {
        const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const dp = obj?.dadosPropostos ?? obj;
        return String(dp?.benRelacaoDep ?? '').trim();
      }
    } catch {}
    return '';
  }

  // Em modo lote, bloqueia aprovação de dependente sem relação de dependência definida (não é titular e rel vazia)
  private isRelacaoDepMissingFor(selected: Solicitacao | null): boolean {
    if (!selected || selected.tipo !== 'inclusao') return false;
    const rel = this.obterRelacaoDepDaSelecionada();
    const label = (() => {
      try {
        const l1 = String(this.dadosDetalhes?.benRelacaoDepLabel ?? '').toLowerCase();
        if (l1) return l1;
        const raw = selected?.dadosJson;
        if (raw) {
          const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const dp = obj?.dadosPropostos ?? obj;
          return String(dp?.benRelacaoDepLabel ?? '').toLowerCase();
        }
      } catch {}
      return '';
    })();
    if (rel === '00') return false;
    if (label && label !== 'titular' && rel === '') return true;
    return false;
  }

  podeAprovarSelecionado(): boolean {
    if (!this.selected) return false;
    if (this.selected.status !== 'pendente') return false;
    return !this.isRelacaoDepMissingFor(this.selected);
  }

  podeAprovarConfirmacao(): boolean {
    return !this.isRelacaoDepMissingFor(this.approvalSolicitacao);
  }

  baixarAnexo(idx: number) {
    const a = this.anexosSelecionado[idx];
    if (!a?.dataUrl) return;
    const link = document.createElement('a');
    link.href = a.dataUrl;
    link.download = a.nome;
    link.click();
  }

  /**
   * Atualizar lista de solicitações manualmente
   */
  // Atualiza lista manualmente e dá feedback de carregamento
  atualizarLista() {
    this.carregando = true;
    this.aprovacao.atualizarSolicitacoes();
    
    // Simular delay para feedback visual
    setTimeout(() => {
      this.carregando = false;
    }, 1000);
  }

  // Após ações, força refresh da lista com leve atraso
  private refreshAfterAction() {
    setTimeout(() => this.atualizarLista(), 800);
    setTimeout(() => this.atualizarLista(), 2000);
  }
  // Exibe botão de completar dependentes (lote) apenas quando há lote, dependente sem relação e sem vinculoOk
  podeForcarCompletar(): boolean {
    if (!this.selected || this.selected.tipo !== 'inclusao') return false;
    const rel = this.obterRelacaoDepDaSelecionada();
    if (rel === '00') return false;
    const obs = (this.selected.observacoesSolicitacao || (this.selected as any).observacao || '') as string;
    const isLote = /\[Lote:/.test(obs);
    const vinculoFeito = !!this.dadosDetalhes?.benTitularId && !!this.dadosDetalhes?.benMatricula && !!this.dadosDetalhes?.benRelacaoDep;
    return isLote && !vinculoFeito && (rel === '' || rel === undefined);
  }
  // Aciona manualmente a rotina de completar dependentes do lote como fallback
  forcarCompletar() {
    if (!this.selected) return;
    this.aprovacao.forcarCompletarDependentes(this.selected, this.dadosDetalhes);
    this.refreshAfterAction();
  }
}
