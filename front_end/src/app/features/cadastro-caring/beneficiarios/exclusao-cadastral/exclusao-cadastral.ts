import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { InputComponent } from '../../../../shared/components/ui/input/input';

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

  motivos = [
    { value: 'rescisao', label: 'Rescisão' },
    { value: 'falecimento', label: 'Falecimento' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'outro', label: 'Outro' }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

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
    if (!this.beneficiario.matricula || !this.motivo) {
      alert('Selecione o motivo e verifique a matrícula do beneficiário.');
      return;
    }

    const key = 'beneficiariosStatus';
    const existing = localStorage.getItem(key);
    const store: Record<string, { status: string; motivo: string; dataExclusao?: string }> = existing ? JSON.parse(existing) : {};
    store[this.beneficiario.matricula] = { status: this.status, motivo: this.motivo, dataExclusao: this.dataExclusao };
    localStorage.setItem(key, JSON.stringify(store));

    alert('Status atualizado com sucesso');
    this.router.navigateByUrl('/cadastro-caring/beneficiarios');
  }
}

