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

  // Modal de aprovação para inclusão
  showApprovalModal = false;
  approvalSolicitacao: Solicitacao | null = null;
  dadosAprovacao = {
    benCodCartao: '',
    benCodUnimedSeg: ''
  };

  constructor(private aprovacao: AprovacaoService, private beneficiarios: BeneficiariosService, private solicitacoesService: SolicitacaoBeneficiarioService) {
    // Carregar todas as solicitações ao inicializar
    this.aprovacao.atualizarSolicitacoes();
  }

  get lista(): Solicitacao[] {
    const filtered = this.aprovacao.list().filter(s => {
      const mt = !this.filtroTipo || s.tipo === this.filtroTipo;
      const ms = !this.filtroStatus || s.status === this.filtroStatus as any;
      const tt = !this.termo || `${s.identificador} ${s.descricao} ${s.solicitante} ${s.codigoEmpresa || ''}`.toLowerCase().includes(this.termo.toLowerCase());
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
              return;
            }
            // Fallback: usa listRaw para garantir que encontre o registro recém-criado
            this.beneficiarios.listRaw().subscribe({
              next: (lista: any[]) => {
                const raw = lista.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpfId);
                if (raw?.id) {
                  aplicarAtualizacao(raw.id);
                } else {
                  // Tenta novamente após pequeno delay (processamento de back-end)
                  setTimeout(() => {
                    this.beneficiarios.listRaw().subscribe({
                      next: (lista2: any[]) => {
                        const raw2 = lista2.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpfId);
                        if (raw2?.id) aplicarAtualizacao(raw2.id);
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

  openDetails(s: Solicitacao) {
    this.selected = s;
    this.observacaoAprovacao = '';
    this.dadosDetalhes = s?.dadosPropostos || null;
    this.showInclusaoDetails = false;
    this.historicoCompleto = [];
    this.enriquecerTitularInfo();
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
              if (!d) return new Date().toISOString();
              if (d instanceof Date) return d.toISOString();
              if (typeof d === 'string') return d;
              try { return new Date(d).toISOString(); } catch { return new Date().toISOString(); }
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

  aceitarSelecionado() {
    if (!this.selected || this.selected.status === 'concluida') return;
    this.aprovar(this.selected.id);
  }

  negarSelecionado() {
    if (!this.selected || this.selected.status === 'concluida') return;
    this.aprovacao.updateStatus(this.selected.id, 'aguardando', this.observacaoAprovacao || '');
    // Adiciona observação ao histórico local
    if (this.selected) {
      if (!this.selected.historico) this.selected.historico = [];
      this.selected.historico.push({
        data: new Date().toISOString(),
        status: 'aguardando',
        observacao: this.observacaoAprovacao || 'Negação sem observação.'
      });
    }
    this.closeDetails();
    this.atualizarLista();
    this.observacaoAprovacao = '';
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
  atualizarLista() {
    this.carregando = true;
    this.aprovacao.atualizarSolicitacoes();
    
    // Simular delay para feedback visual
    setTimeout(() => {
      this.carregando = false;
    }, 1000);
  }

  private refreshAfterAction() {
    setTimeout(() => this.atualizarLista(), 800);
    setTimeout(() => this.atualizarLista(), 2000);
  }
}
