import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { AprovacaoService, Solicitacao } from '../aprovacao.service';
import { BeneficiariosService } from '../../beneficiarios/beneficiarios.service';

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
    if (s && s.entidade === 'beneficiario' && s.identificador) {
      this.beneficiarios.setStatusByCpf(s.identificador, 'Ativo');
    }
  }

  pendente(id: string) {
    const s = this.aprovacao.list().find(x => x.id === id);
    this.aprovacao.updateStatus(id, 'pendente');
    if (s && s.entidade === 'beneficiario' && s.identificador) {
      this.beneficiarios.setStatusByCpf(s.identificador, 'Pendente');
    }
  }
}
