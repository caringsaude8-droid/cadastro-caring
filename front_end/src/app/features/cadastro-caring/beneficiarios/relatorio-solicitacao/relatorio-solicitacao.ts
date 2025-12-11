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
    const obs = empresa?.id ? this.service.listarTodasPorEmpresa(empresa.id) : this.service.listarTodas();
    obs.subscribe({
      next: (rows) => {
        this.data = rows.map(this.mapRow);
        this.filtered = this.data;
        this.tiposDisponiveis = Array.from(new Set(this.data.map(r => r.tipo).filter(Boolean)));
        this.statusDisponiveis = Array.from(new Set(this.data.map(r => r.status).filter(Boolean)));
        this.updateStats();
        this.loading = false;
      },
      error: () => { this.error = 'Erro ao carregar solicitações'; this.loading = false; }
    });
  }

  private mapRow = (s: SolicitacaoBeneficiario): Row => ({
    id: s.id || 0,
    numero: s.numeroSolicitacao || String(s.id || ''),
    nome: s.beneficiarioNome,
    cpf: s.beneficiarioCpf,
    tipo: s.tipo,
    status: s.status || 'PENDENTE',
    data: (s.dataSolicitacao instanceof Date ? s.dataSolicitacao.toISOString() : (s.dataSolicitacao as any)) || new Date().toISOString(),
    observacoesSolicitacao: s.observacoesSolicitacao,
    observacoesAprovacao: s.observacoesAprovacao,
    solicitante: s.usuarioSolicitanteNome
  });

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
}
