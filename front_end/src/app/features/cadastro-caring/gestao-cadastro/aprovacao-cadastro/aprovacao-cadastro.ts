import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { AprovacaoService, Solicitacao } from '../aprovacao.service';
import { BeneficiariosService } from '../../beneficiarios/beneficiarios.service';

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
  motivoNegacao: string = '';
  anexosSelecionado: Anexo[] = [];
  carregando = false;

  constructor(private aprovacao: AprovacaoService, private beneficiarios: BeneficiariosService) {}

  get lista(): Solicitacao[] {
    return this.aprovacao.list().filter(s => {
      const mt = !this.filtroTipo || s.tipo === this.filtroTipo;
      const ms = !this.filtroStatus || s.status === this.filtroStatus as any;
      const tt = !this.termo || `${s.identificador} ${s.descricao} ${s.solicitante} ${s.codigoEmpresa || ''}`.toLowerCase().includes(this.termo.toLowerCase());
      return mt && ms && tt;
    });
  }

  aprovar(id: string) {
    const s = this.aprovacao.list().find(x => x.id === id);
    this.aprovacao.updateStatus(id, 'concluida');
    if (!s) return;
    if (s.entidade === 'beneficiario' && s.identificador) {
      if (s.tipo === 'inclusao') {
        // Para inclusão aprovada, buscar beneficiário (status 'Pendente') e ativar
        this.beneficiarios.buscarPorFiltros({ cpf: s.identificador }).subscribe({
          next: (beneficiarios) => {
            const beneficiario = beneficiarios.find(b => b.cpf === s.identificador && (b.benStatus === 'Pendente' || !b.benStatus));
            if (beneficiario) {
              // Atualizar status de 'Pendente' para 'Ativo' via API
              this.beneficiarios.alterarBeneficiario(beneficiario.id, { benStatus: 'Ativo' }).subscribe({
                next: () => console.log('✅ Beneficiário aprovado - Status alterado para Ativo:', s.identificador),
                error: (error) => console.error('❌ Erro ao ativar beneficiário:', error)
              });
            } else {
              console.warn('⚠️ Beneficiário não encontrado ou já ativo:', s.identificador);
            }
          },
          error: (error) => console.error('❌ Erro ao buscar beneficiário para aprovação:', error)
        });
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
                  next: () => console.log('✅ Beneficiário excluído:', s.identificador),
                  error: (error) => console.error('❌ Erro ao excluir beneficiário:', error)
                });
              } catch (error) {
                console.error('❌ Erro ao processar dados de exclusão:', error);
                // Fallback: exclusão com motivo padrão
                this.beneficiarios.excluirBeneficiario(beneficiario.id, 'RESCISAO').subscribe({
                  next: () => console.log('✅ Beneficiário excluído (fallback):', s.identificador),
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
              next: () => console.log('✅ Beneficiário marcado como pendente:', s.identificador),
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
    this.motivoNegacao = '';
    try {
      const saved = localStorage.getItem(`solicitacaoAjustes:${s.id}`);
      const parsed = saved ? JSON.parse(saved) : null;
      this.anexosSelecionado = parsed?.anexos || [];
    } catch { this.anexosSelecionado = []; }
    this.showDetails = true;
  }

  closeDetails() {
    this.showDetails = false;
    this.selected = null;
    this.motivoNegacao = '';
  }

  aceitarSelecionado() {
    if (!this.selected || this.selected.status === 'concluida') return;
    this.aprovar(this.selected.id);
    this.closeDetails();
  }

  negarSelecionado() {
    if (!this.selected || this.selected.status === 'concluida') return;
    this.aprovacao.updateStatus(this.selected.id, 'aguardando', this.motivoNegacao || '');
    this.closeDetails();
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
}
