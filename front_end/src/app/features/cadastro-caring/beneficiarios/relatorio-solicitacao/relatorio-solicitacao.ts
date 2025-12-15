import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { SolicitacaoBeneficiarioService, SolicitacaoBeneficiario } from '../../gestao-cadastro/solicitacao-beneficiario.service';
import { EmpresaContextService } from '../../../../shared/services/empresa-context.service';
import { Empresa } from '../../empresa/empresa.service';

type Row = {
  id: number;
  numero: string;
  nome: string;
  cpf: string;
  tipo: string;
  status: string;
  data: string;
  observacoesSolicitacao?: string;
  observacoesAprovacao?: string;
  solicitante?: string;
};

@Component({
  selector: 'app-relatorio-solicitacao',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './relatorio-solicitacao.html',
  styleUrl: './relatorio-solicitacao.css'
})
export class RelatorioSolicitacaoComponent implements OnInit {
  loading = false;
  error = '';
  termo = '';
  data: Row[] = [];
  filtered: Row[] = [];
  empresaSelecionada: Empresa | null = null;
  stats = { total: 0, pendentes: 0, aprovadas: 0, rejeitadas: 0 };
  selectedTipo = '';
  selectedStatus = '';
  tiposDisponiveis: string[] = [];
  statusDisponiveis: string[] = [];

  constructor(private service: SolicitacaoBeneficiarioService, private empresaContext: EmpresaContextService) {}

  ngOnInit(): void {
    this.loading = true;
    const empresa = this.empresaContext.getEmpresaSelecionada();
    this.empresaSelecionada = empresa || null;
    const cached = this.service.getCached();
    if (Array.isArray(cached) && cached.length > 0) {
      this.data = cached.map(this.mapRow);
      this.tiposDisponiveis = Array.from(new Set(this.data.map(r => r.tipo).filter(Boolean)));
      this.statusDisponiveis = Array.from(new Set(this.data.map(r => r.status).filter(Boolean)));
      this.termo = '';
      this.selectedTipo = '';
      this.selectedStatus = '';
      this.filtered = this.data;
      this.updateStats();
    }
    this.service.refresh(empresa?.id).subscribe({
      next: (rows) => {
        this.data = rows.map(this.mapRow);
        this.tiposDisponiveis = Array.from(new Set(this.data.map(r => r.tipo).filter(Boolean)));
        this.statusDisponiveis = Array.from(new Set(this.data.map(r => r.status).filter(Boolean)));
        this.termo = '';
        this.selectedTipo = '';
        this.selectedStatus = '';
        this.filtered = this.data;
        this.updateStats();
        this.loading = false;
      },
      error: () => { 
        if (!Array.isArray(cached) || cached.length === 0) {
          this.error = 'Erro ao carregar solicitações'; 
        }
        this.loading = false; 
      }
    });
  }

  private mapRow = (s: SolicitacaoBeneficiario): Row => ({
    id: s.id || 0,
    numero: s.numeroSolicitacao || String(s.id || ''),
    nome: s.beneficiarioNome,
    cpf: s.beneficiarioCpf,
    tipo: s.tipo,
    status: s.status || 'PENDENTE',
    data: this.normalizeDate(s.dataSolicitacao),
    observacoesSolicitacao: s.observacoesSolicitacao,
    observacoesAprovacao: s.observacoesAprovacao,
    solicitante: s.usuarioSolicitanteNome
  });

  private normalizeDate(raw: any): string {
    if (!raw) return new Date().toISOString();
    if (raw instanceof Date) return raw.toISOString();
    const s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
    if (m) {
      const dd = parseInt(m[1], 10), mm = parseInt(m[2], 10), yyyy = parseInt(m[3], 10);
      const hh = parseInt(m[4] || '0', 10), min = parseInt(m[5] || '0', 10), ss = parseInt(m[6] || '0', 10);
      const d = new Date(yyyy, mm - 1, dd, hh, min, ss);
      return d.toISOString();
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString();
    return new Date().toISOString();
  }

  filtrar(): void {
    const q = (this.termo || '').toLowerCase().replace(/\s+/g, '');
    this.filtered = this.data.filter(r => {
      const nome = (r.nome || '').toLowerCase().replace(/\s+/g, '');
      const cpf = (r.cpf || '').replace(/\D/g, '');
      const numero = (r.numero || '').toLowerCase();
      const matchText = (!q) || nome.includes(q) || cpf.includes(q) || numero.includes(q);
      const matchTipo = (!this.selectedTipo) || (r.tipo || '') === this.selectedTipo;
      const matchStatus = (!this.selectedStatus) || (r.status || '') === this.selectedStatus;
      return matchText && matchTipo && matchStatus;
    });
    this.updateStats();
  }

  exportarExcel(): void {
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
        .col-solicitante { width: 200px; }
        .col-nome { width: 360px; }
        .col-cpf { width: 160px; }
        .col-tipo { width: 140px; }
        .col-status { width: 120px; }
        .col-data { width: 160px; }
        .col-obs { width: 240px; }
        .nowrap { white-space: nowrap; }
        .clip { display: block; white-space: nowrap; overflow: hidden; }
      </style>
    `;
    const thStyle = `style="background:#0b5fa4;color:#ffffff;font-weight:700;text-align:center;border-bottom:2px solid #063a6b;padding:8px 10px"`;
    const header = `
      <tr>
        <th ${thStyle} class="col-solicitante" bgcolor="#0b5fa4">Solicitante</th>
        <th ${thStyle} class="col-nome" bgcolor="#0b5fa4">Nome</th>
        <th ${thStyle} class="col-cpf" bgcolor="#0b5fa4">CPF</th>
        <th ${thStyle} class="col-tipo" bgcolor="#0b5fa4">Tipo</th>
        <th ${thStyle} class="col-status" bgcolor="#0b5fa4">Status</th>
        <th ${thStyle} class="col-data" bgcolor="#0b5fa4">Data</th>
        <th ${thStyle} class="col-obs" bgcolor="#0b5fa4">Obs. Solicitação</th>
        <th ${thStyle} class="col-obs" bgcolor="#0b5fa4">Obs. Aprovação</th>
      </tr>
    `;
    const linhas = this.filtered.map((r, i) => `
      <tr class="${i % 2 === 1 ? 'row-alt' : ''}">
        <td class="cell-left">${this.ensureNbsp(this.sanitizeCell(r.solicitante))}</td>
        <td class="cell-left"><div class="clip" style="width:100%">${this.ensureNbsp(this.sanitizeCell(r.nome))}</div></td>
        <td class="cell-right mso-text" style="mso-number-format:'@'">${this.ensureNbsp(this.sanitizeCell(r.cpf))}</td>
        <td class="cell-center">${this.ensureNbsp(this.sanitizeCell(r.tipo))}</td>
        <td class="cell-center">${this.ensureNbsp(this.sanitizeCell(r.status))}</td>
        <td class="cell-center">${this.formatDateBRTime(r.data)}</td>
        <td class="cell-left nowrap" style="white-space:nowrap;width:240px"><div class="clip" style="width:100%">${this.ensureNbsp(this.sanitizeNoWrap(r.observacoesSolicitacao))}</div></td>
        <td class="cell-left nowrap" style="white-space:nowrap;width:240px"><div class="clip" style="width:100%">${this.ensureNbsp(this.sanitizeNoWrap(r.observacoesAprovacao))}</div></td>
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
    a.download = 'relatorio-solicitacoes.xls';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportarCsv(): void {
    const header = ['Solicitante','Nome','CPF','Tipo','Status','Data','Obs. Solicitação','Obs. Aprovação'];
    const linhas = this.filtered.map(r => [
      r.solicitante || '',
      r.nome || '',
      r.cpf || '',
      r.tipo || '',
      r.status || '',
      r.data ? new Date(r.data).toISOString().split('T')[0] : '',
      r.observacoesSolicitacao || '',
      r.observacoesAprovacao || ''
    ]);
    const csv = [header.join(','), ...linhas.map(l => l.map(v => `"${(v || '').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-solicitacoes.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  clearFilters(): void {
    this.termo = '';
    this.selectedTipo = '';
    this.selectedStatus = '';
    this.filtered = this.data;
    this.updateStats();
  }

  private updateStats(): void {
    const total = this.filtered.length;
    const pendentes = this.filtered.filter(r => (r.status || '').toUpperCase() === 'PENDENTE').length;
    const aprovadas = this.filtered.filter(r => (r.status || '').toUpperCase() === 'APROVADA').length;
    const rejeitadas = this.filtered.filter(r => ['REJEITADA','CANCELADA'].includes((r.status || '').toUpperCase())).length;
    this.stats = { total, pendentes, aprovadas, rejeitadas };
  }

  private formatDateBRTime(raw: string): string {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    const dd = ('0' + d.getDate()).slice(-2);
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    const hh = ('0' + d.getHours()).slice(-2);
    const mi = ('0' + d.getMinutes()).slice(-2);
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }

  private sanitizeCell(v: any): string {
    const s = (v ?? '').toString();
    const noBreaks = s.replace(/<br\s*\/?>/gi, ' ').replace(/\r?\n|\r/g, ' ');
    const collapsed = noBreaks.replace(/\s{2,}/g, ' ').trim();
    return collapsed
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  private sanitizeNoWrap(v: any): string {
    const base = this.sanitizeCell(v);
    const nbSpaces = base.replace(/ /g, '&nbsp;');
    const nbHyphen = nbSpaces.replace(/-/g, '&#8209;');
    return nbHyphen;
  }
  private ensureNbsp(s: string): string {
    return s && s.length > 0 ? s : '&nbsp;';
  }
}
