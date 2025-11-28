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
        this.beneficiarios.setStatusByCpf(s.identificador, 'Ativo');
      } else if (s.tipo === 'exclusao') {
        const all = this.beneficiarios.list();
        const match = all.find(b => b.cpf === s.identificador || b.matricula_beneficiario === s.identificador);
        const matricula = match?.matricula_beneficiario || s.identificador;
        try {
          const raw = localStorage.getItem('beneficiariosStatus');
          const store = raw ? JSON.parse(raw) as Record<string, { status: string; motivo: string; dataExclusao?: string }> : {};
          const entry = store[matricula];
          const statusFinal = entry?.status || 'Excluído';
          const d = entry?.dataExclusao;
          let when: Date | undefined = undefined;
          if (d) {
            const [y, m, day] = d.split('-').map(v => parseInt(v, 10));
            when = new Date(y, (m || 1) - 1, day || 1);
          }
          this.beneficiarios.marcarExclusaoPorMatricula(matricula, when, statusFinal);
        } catch {
          this.beneficiarios.marcarExclusaoPorMatricula(matricula, new Date(), 'Excluído');
        }
      }
    }
  }

  pendente(id: string) {
    const s = this.aprovacao.list().find(x => x.id === id);
    this.aprovacao.updateStatus(id, 'pendente');
    if (s && s.entidade === 'beneficiario' && s.identificador) {
      this.beneficiarios.setStatusByCpf(s.identificador, 'Pendente');
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
}
