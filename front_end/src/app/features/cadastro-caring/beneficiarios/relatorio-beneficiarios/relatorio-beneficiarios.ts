import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { BeneficiariosService, Beneficiario } from '../beneficiarios.service';
import { EmpresaContextService } from '../../../../shared/services/empresa-context.service';
import { Empresa } from '../../empresa/empresa.service';

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
  empresaSelecionada: Empresa | null = null;
  stats = { total: 0, ativos: 0, inativos: 0 };
  selectedDependencia = '';
  selectedStatus = '';
  statusDisponiveis: string[] = [];

  constructor(private beneficiarios: BeneficiariosService, private empresaContextService: EmpresaContextService) {}

  ngOnInit(): void {
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();
    this.loading = true;
    const empresaId = this.empresaSelecionada?.id || null;
    this.beneficiarios.listRaw(empresaId || undefined).subscribe({
      next: (rawRows: any[]) => {
        const empId = this.empresaSelecionada?.id || null;
        const empCodSel = this.empresaSelecionada?.codigoEmpresa || '';
        const filtrados = (rawRows || []).filter((raw: any) => {
          const rEmpId = raw.benEmpId ?? raw.empId ?? raw.empresaId ?? raw.ben_emp_id ?? raw.emp_id;
          const rEmpCod = raw.codigoEmpresa ?? raw.empCodigo ?? raw.codigo_empresa;
          if (empId != null && rEmpId != null) return Number(rEmpId) === Number(empId);
          if (empCodSel && rEmpCod != null) return String(rEmpCod) === String(empCodSel);
          return true;
        });
        const mapped: Beneficiario[] = filtrados.map((raw: any) => ({
          id: raw.id,
          nome: raw.nome || raw.benNomeSegurado || '',
          cpf: raw.cpf || raw.benCpf || '',
          nascimento: raw.nascimento || (raw.benDtaNasc || ''),
          data_inclusao: this.parseApiDate(raw.data_inclusao || raw.benDtaInclusao) || new Date(),
          data_exclusao: this.parseApiDate(raw.data_exclusao || raw.benDtaExclusao),
          tipo_dependencia: raw.tipo_dependencia || (raw.benRelacaoDep === '00' ? 'titular' : 'dependente'),
          acomodacao: raw.acomodacao || this.mapearAcomodacao(raw.benPlanoProd),
          matricula_beneficiario: raw.matricula_beneficiario || raw.benMatricula || '',
          matricula_titular: raw.matricula_titular || '',
          celular: raw.celular || raw.benDddCel || '',
          email: raw.email || raw.benEmail || '',
          benStatus: raw.benStatus || 'Ativo'
        }));
        this.data = mapped;
        this.filtered = mapped;
        this.statusDisponiveis = Array.from(new Set(mapped.map(r => r.benStatus).filter(Boolean)));
        this.updateStats();
        this.loading = false;
      },
      error: () => { this.error = 'Erro ao carregar beneficiários'; this.loading = false; }
    });
  }

  filtrar(): void {
    const q = (this.termo || '').toLowerCase().replace(/\s+/g, '');
    this.filtered = this.data.filter(b => {
      const nome = (b.nome || '').toLowerCase().replace(/\s+/g, '');
      const cpf = (b.cpf || '').replace(/\D/g, '');
      const matricula = (b.matricula_beneficiario || '').toLowerCase();
      const matchText = (!q) || nome.includes(q) || cpf.includes(q) || matricula.includes(q);
      const matchDep = (!this.selectedDependencia) || (b.tipo_dependencia || '') === this.selectedDependencia;
      const matchStatus = (!this.selectedStatus) || (b.benStatus || '') === this.selectedStatus;
      return matchText && matchDep && matchStatus;
    });
    this.updateStats();
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

  clearFilters(): void {
    this.termo = '';
    this.selectedDependencia = '';
    this.selectedStatus = '';
    this.filtered = this.data;
    this.updateStats();
  }

  private updateStats(): void {
    const total = this.filtered.length;
    const ativos = this.filtered.filter(r => (r.benStatus || '').toLowerCase() === 'ativo').length;
    const inativos = this.filtered.filter(r => (r.benStatus || '').toLowerCase() !== 'ativo').length;
    this.stats = { total, ativos, inativos };
  }

  private parseApiDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string') {
      const s = value.trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/');
        const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        return isNaN(dt.getTime()) ? null : dt;
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const dt = new Date(s);
        return isNaN(dt.getTime()) ? null : dt;
      }
      const dt = new Date(s);
      return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  }

  private mapearAcomodacao(planoProd: string): string {
    const m: { [key: string]: string } = {
      'ADMDTXCP': 'Apartamento',
      'QUPLTXCP': 'Quarto',
      'ENFLTXCP': 'Enfermaria'
    };
    return m[planoProd] || 'Standard';
  }
}
