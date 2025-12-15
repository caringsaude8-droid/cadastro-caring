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
    const empId = this.empresaSelecionada?.id || null;
    const empCodSel = this.empresaSelecionada?.codigoEmpresa || '';
    const cached = this.beneficiarios.getRawCached();
    if (Array.isArray(cached) && cached.length > 0) {
      const filtradosCached = (cached || []).filter((raw: any) => {
        const rEmpId = raw.benEmpId ?? raw.empId ?? raw.empresaId ?? raw.ben_emp_id ?? raw.emp_id;
        const rEmpCod = raw.codigoEmpresa ?? raw.empCodigo ?? raw.codigo_empresa;
        if (empId != null && rEmpId != null) return Number(rEmpId) === Number(empId);
        if (empCodSel && rEmpCod != null) return String(rEmpCod) === String(empCodSel);
        return true;
      });
      const mappedCached: Beneficiario[] = filtradosCached.map((raw: any) => ({
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
      this.data = mappedCached;
      this.filtered = mappedCached;
      this.statusDisponiveis = Array.from(new Set(mappedCached.map(r => r.benStatus).filter(Boolean)));
      this.updateStats();
      // Mantém loading enquanto atualiza com a API
    }
    this.beneficiarios.refreshRaw(empresaId || undefined).subscribe({
      next: (rawRows: any[]) => {
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
      error: () => { 
        this.error = 'Erro ao carregar beneficiários'; 
        this.loading = false; 
      }
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
    const estilo = `
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; table-layout: fixed; }
        th, td { border: 1px solid #cfd8dc; padding: 8px 10px; font-size: 11.5pt; color: #263238; }
        th { 
          background: #0b5fa4;
          color: #ffffff; 
          font-weight: 700; 
          text-align: center; 
          letter-spacing: 0.2px;
          border-bottom: 2px solid #063a6b;
        }
        .cell-left { text-align: left; }
        .cell-right { text-align: right; }
        .cell-center { text-align: center; }
        .mso-text { mso-number-format:'@'; }
        .row-alt { background: #fafafa; }
        .col-nome { width: 360px; }
        .col-cpf { width: 160px; }
        .col-nasc { width: 120px; }
        .col-data { width: 120px; }
        .col-tipo { width: 140px; }
        .col-acom { width: 140px; }
        .col-mat { width: 140px; }
        .col-status { width: 120px; }
        .clip { display: block; white-space: nowrap; overflow: hidden; }
      </style>
    `;
    const thStyle = `style="background:#0b5fa4;color:#ffffff;font-weight:700;text-align:center;border-bottom:2px solid #063a6b;padding:8px 10px"`;
    const header = `
      <tr>
        <th ${thStyle} class="col-nome" bgcolor="#0b5fa4">Nome</th>
        <th ${thStyle} class="col-cpf" bgcolor="#0b5fa4">CPF</th>
        <th ${thStyle} class="col-nasc" bgcolor="#0b5fa4">Nascimento</th>
        <th ${thStyle} class="col-data" bgcolor="#0b5fa4">Data Inclusão</th>
        <th ${thStyle} class="col-data" bgcolor="#0b5fa4">Data Exclusão</th>
        <th ${thStyle} class="col-tipo" bgcolor="#0b5fa4">Tipo Dependência</th>
        <th ${thStyle} class="col-acom" bgcolor="#0b5fa4">Acomodação</th>
        <th ${thStyle} class="col-mat" bgcolor="#0b5fa4">Matrícula</th>
        <th ${thStyle} class="col-status" bgcolor="#0b5fa4">Status</th>
      </tr>
    `;
    const linhas = this.filtered.map((r, i) => `
      <tr class="${i % 2 === 1 ? 'row-alt' : ''}">
        <td class="cell-left"><div class="clip" style="width:100%">${(r.nome || '').toString()}</div></td>
        <td class="cell-right mso-text" style="mso-number-format:'@'">${(r.cpf || '').toString()}</td>
        <td class="cell-center">${(r.nascimento || '').toString()}</td>
        <td class="cell-center">${this.formatDateBR(r.data_inclusao)}</td>
        <td class="cell-center">${this.formatDateBR(r.data_exclusao)}</td>
        <td class="cell-center">${(r.tipo_dependencia || '').toString()}</td>
        <td class="cell-left">${(r.acomodacao || '').toString()}</td>
        <td class="cell-right mso-text" style="mso-number-format:'@'">${(r.matricula_beneficiario || '').toString()}</td>
        <td class="cell-center">${(r.benStatus || '').toString()}</td>
      </tr>
    `).join('');
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8">${estilo}</head>
        <body>
          <table>
            ${header}
            ${linhas}
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=UTF-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-beneficiarios.xls';
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
  exportarExcel(): void { this.exportarCsv(); }

  private updateStats(): void {
    const total = this.filtered.length;
    const ativos = this.filtered.filter(r => (r.benStatus || '').toLowerCase() === 'ativo').length;
    const inativos = this.filtered.filter(r => (r.benStatus || '').toLowerCase() !== 'ativo').length;
    this.stats = { total, ativos, inativos };
  }
  private formatDateBR(d: Date | null): string {
    if (!d) return '';
    const dd = ('0' + d.getDate()).slice(-2);
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
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
