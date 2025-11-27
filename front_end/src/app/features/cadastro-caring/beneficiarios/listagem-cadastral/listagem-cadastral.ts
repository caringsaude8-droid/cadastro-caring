import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { BeneficiariosService, Beneficiario } from '../beneficiarios.service';

interface BeneficiarioRow {
  nome: string;
  cpf: string;
  nascimento: string;
  dataInclusao: string;
  dataExclusao: string;
  dependencia: string;
  acomodacao: string;
  matricula: string;
  matriculaTitular: string;
  status?: string;
}

@Component({
  selector: 'app-listagem-cadastral',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './listagem-cadastral.html',
  styleUrl: './listagem-cadastral.css'
})
export class ListagemCadastralComponent {
  constructor(private service: BeneficiariosService) {}

  get rows(): BeneficiarioRow[] {
    const list: Beneficiario[] = this.service.list();
    const statusesRaw = localStorage.getItem('beneficiariosStatus');
    const statuses: Record<string, { status: string; motivo: string; dataExclusao?: string }> = statusesRaw ? JSON.parse(statusesRaw) : {};
    return list.map(b => {
      const s = statuses[b.matricula_beneficiario];
      const statusFinal = s ? s.status : (b.status || undefined);
      return {
        nome: b.nome,
        cpf: b.cpf,
        nascimento: b.nascimento,
        dataInclusao: new Date(b.data_inclusao).toLocaleDateString('pt-BR'),
        dataExclusao: b.data_exclusao ? new Date(b.data_exclusao).toLocaleDateString('pt-BR') : '',
        dependencia: b.tipo_dependencia,
        acomodacao: b.acomodacao,
        matricula: b.matricula_beneficiario,
        matriculaTitular: b.matricula_titular,
        status: statusFinal
      } as BeneficiarioRow;
    });
  }
}
