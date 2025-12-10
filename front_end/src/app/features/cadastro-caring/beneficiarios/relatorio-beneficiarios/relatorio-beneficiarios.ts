import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { BeneficiariosService, Beneficiario } from '../beneficiarios.service';

@Component({
  selector: 'app-relatorio-beneficiarios',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './relatorio-beneficiarios.html',
  styleUrl: './relatorio-beneficiarios.css'
})
export class RelatorioBeneficiariosComponent implements OnInit {
  loading = false;
  error = '';
  termo = '';
  data: Beneficiario[] = [];
  filtered: Beneficiario[] = [];

  constructor(private beneficiarios: BeneficiariosService) {}

  ngOnInit(): void {
    this.loading = true;
    this.beneficiarios.list().subscribe({
      next: (rows) => { this.data = rows; this.filtered = rows; this.loading = false; },
      error: () => { this.error = 'Erro ao carregar beneficiários'; this.loading = false; }
    });
  }

  filtrar(): void {
    const q = (this.termo || '').toLowerCase().replace(/\s+/g, '');
    this.filtered = this.data.filter(b => {
      const nome = (b.nome || '').toLowerCase().replace(/\s+/g, '');
      const cpf = (b.cpf || '').replace(/\D/g, '');
      const matricula = (b.matricula_beneficiario || '').toLowerCase();
      return (!q) || nome.includes(q) || cpf.includes(q) || matricula.includes(q);
    });
  }

  exportarCsv(): void {
    const header = ['Nome','CPF','Nascimento','Data Inclusão','Data Exclusão','Tipo Dependência','Acomodação','Matrícula','Status'];
    const linhas = this.filtered.map(r => [
      r.nome || '',
      r.cpf || '',
      r.nascimento || '',
      r.data_inclusao ? new Date(r.data_inclusao).toISOString().split('T')[0] : '',
      r.data_exclusao ? new Date(r.data_exclusao).toISOString().split('T')[0] : '',
      r.tipo_dependencia || '',
      r.acomodacao || '',
      r.matricula_beneficiario || '',
      r.benStatus || ''
    ]);
    const csv = [header.join(','), ...linhas.map(l => l.map(v => `"${(v || '').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-beneficiarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
