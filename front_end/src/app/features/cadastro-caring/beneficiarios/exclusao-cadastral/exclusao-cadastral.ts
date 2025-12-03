import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AprovacaoService } from '../../gestao-cadastro/aprovacao.service';
import { BeneficiariosService } from '../beneficiarios.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { InputComponent } from '../../../../shared/components/ui/input/input';
import { AuthService } from '../../../../core/services/auth.service';

type BeneficiarioInfo = {
  nome?: string;
  cpf?: string;
  matricula?: string;
};

@Component({
  selector: 'app-exclusao-cadastral',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, InputComponent],
  templateUrl: './exclusao-cadastral.html',
  styleUrl: './exclusao-cadastral.css'
})
export class ExclusaoCadastralComponent implements OnInit {
  beneficiario: BeneficiarioInfo = {};
  motivo: string = '';
  dataExclusao: string = '';
  status: string = '';
  minDate: string = '';
  dateError: string = '';
  successMessage: string = '';
  mensagem: string = '';
  tipoMotivo: string = 'E'; // E=Exclusão

  motivos = [
    { value: 'rescisao', label: 'Rescisão' },
    { value: 'falecimento', label: 'Falecimento' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'outro', label: 'Outro' }
  ];

  constructor(private route: ActivatedRoute, private router: Router, private aprovacao: AprovacaoService, private beneficiarios: BeneficiariosService, private auth: AuthService) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.beneficiario = {
      nome: qp.get('nome') || undefined,
      cpf: qp.get('cpf') || undefined,
      matricula: qp.get('matricula') || undefined
    };
    this.motivo = qp.get('motivo') || '';
    this.dataExclusao = qp.get('dataExclusao') || '';
    this.atualizarStatus();
    const t = new Date();
    const y = t.getFullYear();
    const m = ('0' + (t.getMonth() + 1)).slice(-2);
    const d = ('0' + t.getDate()).slice(-2);
    this.minDate = `${y}-${m}-${d}`;
  }

  atualizarStatus(): void {
    const map: Record<string, string> = {
      rescisao: 'Rescindido',
      falecimento: 'Falecido',
      transferencia: 'Transferido',
      outro: 'Excluído'
    };
    this.status = map[this.motivo] || '';
  }

  onMotivoChange(value: string): void {
    this.motivo = value;
    this.atualizarStatus();
  }

  confirmar(): void {
    if (!this.beneficiario.matricula) {
      alert('Verifique a matrícula do beneficiário.');
      return;
    }

    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    if (this.dataExclusao) {
      const parts = this.dataExclusao.split('-');
      const chosen = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
      if (chosen < today) { this.dateError = 'Selecione uma data igual ou posterior a hoje.'; return; }
      this.dateError = '';
    }

    const key = 'beneficiariosStatus';
    const existing = localStorage.getItem(key);
    const store: Record<string, { status: string; motivo: string; dataExclusao?: string }> = existing ? JSON.parse(existing) : {};
    const statusFinal = this.status || 'Excluído';
    store[this.beneficiario.matricula] = { status: statusFinal, motivo: this.motivo, dataExclusao: this.dataExclusao };
    localStorage.setItem(key, JSON.stringify(store));

    // Marcar beneficiário como Pendente até aprovação (via API)
    if (this.beneficiario.cpf) {
      this.beneficiarios.buscarPorFiltros({ cpf: this.beneficiario.cpf }).subscribe({
        next: (beneficiarios) => {
          const beneficiario = beneficiarios.find(b => b.cpf === this.beneficiario.cpf);
          if (beneficiario) {
            this.beneficiarios.alterarBeneficiario(beneficiario.id, { benStatus: 'Pendente' }).subscribe({
              next: () => console.log('✅ Beneficiário marcado como pendente para exclusão'),
              error: (error) => console.error('❌ Erro ao marcar status pendente:', error)
            });
          }
        },
        error: (error) => console.error('❌ Erro ao buscar beneficiário:', error)
      });
    }

    try {
      const selected = localStorage.getItem('selectedClinic');
      const clinica = selected ? JSON.parse(selected) : null;
      const user = this.auth.getCurrentUser();
      const author = user?.nome || 'Usuário';
      this.aprovacao.add({
        tipo: 'exclusao',
        entidade: 'beneficiario',
        identificador: this.beneficiario.cpf || this.beneficiario.matricula || '',
        descricao: this.motivo ? `Exclusão do beneficiário ${this.beneficiario.nome || ''} por ${this.motivo}`.trim() : `Exclusão do beneficiário ${this.beneficiario.nome || ''}`.trim(),
        solicitante: 'Dr. João Silva',
        codigoEmpresa: clinica?.codigo,
        observacao: this.mensagem ? `${author}: ${this.mensagem}` : undefined
      });
    } catch {}

    this.successMessage = 'Status atualizado com sucesso';
    setTimeout(() => {
      this.successMessage = '';
      this.router.navigateByUrl('/cadastro-caring/beneficiarios');
    }, 1500);
  }
  onDateChange(val: string) {
    this.dataExclusao = val;
    if (!val) { this.dateError = ''; return; }
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const parts = val.split('-');
    const chosen = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10));
    this.dateError = chosen < today ? 'Selecione uma data igual ou posterior a hoje.' : '';
  }
}
