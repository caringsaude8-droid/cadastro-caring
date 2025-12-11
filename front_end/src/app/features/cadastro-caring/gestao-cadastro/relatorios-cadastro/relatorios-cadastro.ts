import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { BeneficiariosService } from '../../beneficiarios/beneficiarios.service';
import { EmpresaService, Empresa } from '../../empresa/empresa.service';
import { forkJoin } from 'rxjs';

type ReportForm = {
  relacaoDep?: string;
  dataNascimento?: string;
  sexo?: string;
  estadoCivil?: string;
  dataInclusaoExclusao?: string;
  planoProd?: string;
  nomeSegurado?: string;
  cpf?: string;
  cidade?: string;
  uf?: string;
  admissao?: string;
  nomeMae?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  pisPasep?: string;
  matricula?: string;
  lotacaoFuncionario?: string;
  declaracaoNascidoVivo?: string;
  cns?: string;
  dddCelular?: string;
  receberComunicacaoEmail?: string;
  celular?: string;
  email?: string;
  motivoExclusao?: string;
  cidadeResidencia?: string;
  ufResidencia?: string;
  codigoEmpresa?: string;
  numeroEmpresa?: string;
};

type ReportRow = {
  tipoMovto: string;
  codUSeg: string;
  numeroSequencial: string;
  codigoFamilia: string;
  relacaoDep: string;
  digito: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  dataInclusao: string;
  dataExclusao: string;
  planoProd: string;
  nomeSegurado: string;
  cpf: string;
  cidade: string;
  uf: string;
  admissao: string;
  nomeMae: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  pisPasep: string;
  matricula: string;
  lotacaoFuncionario: string;
  declaracaoNascidoVivo: string;
  cns: string;
  dddCelular: string;
  receberComunicacaoEmail: string;
  celular: string;
  email: string;
  motivoExclusao: string;
  cidadeResidencia: string;
  ufResidencia: string;
  codigoEmpresa: string;
  numeroEmpresa: string;
};

@Component({
  selector: 'app-relatorios-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './relatorios-cadastro.html',
  styleUrl: './relatorios-cadastro.css'
})
export class RelatoriosCadastroComponent implements OnInit {
  filtroTermo = '';
  rows: ReportRow[] = [];
  stats = { total: 0, inclusoes: 0, exclusoes: 0 };
  selectedRelacaoDep = '';
  selectedPlanoProd = '';
  planosDisponiveis: string[] = [];
  private knownPlanos: string[] = ['ADMDTXCP','ADMBTXCP'];

  constructor(private beneficiarios: BeneficiariosService, private empresaService: EmpresaService) {}

  ngOnInit(): void {
    const fmt = (d: Date | null) => {
      if (!d) return '';
      const dd = ('0' + (d.getDate() || 0)).slice(-2);
      const mm = ('0' + ((d.getMonth() + 1) || 0)).slice(-2);
      const yyyy = d.getFullYear ? d.getFullYear() : '';
      return (dd && mm && yyyy) ? `${dd}/${mm}/${yyyy}` : '';
    };

    this.empresaService.listarEmpresas().subscribe({
      next: (empresas: Empresa[]) => {
        const requests = empresas.map((e) => this.beneficiarios.listRaw(e.id));
        forkJoin(requests).subscribe((listasPorEmpresa: any[][]) => {
          const rows: ReportRow[] = [];
          const seen = new Set<string>();
          listasPorEmpresa.forEach((lista, idx) => {
            const empresa = empresas[idx];
            const empresaId = empresa.id;
            const empresaCodigo = empresa.codigoEmpresa;
            ((lista || []) as any[])
              .filter((raw: any) => {
                const empId = raw.benEmpId ?? raw.empId ?? raw.empresaId ?? raw.ben_emp_id ?? raw.emp_id;
                const empCod = raw.codigoEmpresa ?? raw.empCodigo ?? raw.codigo_empresa;
                if (empId != null && empresaId != null) return Number(empId) === Number(empresaId);
                if (empCod != null && empresaCodigo) return String(empCod) === String(empresaCodigo);
                return false;
              })
              .forEach((raw: any) => {
                const key = `inclusaoDetalhe:${raw.benCpf || raw.cpf || ''}`;
                const saved = localStorage.getItem(key);
                let form: ReportForm | null = null;
                try { form = saved ? (JSON.parse(saved) as ReportForm) : null; } catch { form = null; }
              const di = raw.benDtaInclusao ? new Date(raw.benDtaInclusao) : null;
              const de = raw.benDtaExclusao ? new Date(raw.benDtaExclusao) : null;
              const uniqKey = `${(raw.benCpf || raw.cpf || '')}-${raw.benEmpId ?? raw.empresaId ?? raw.empId ?? empresaId ?? ''}-${raw.codigoEmpresa ?? empresaCodigo ?? ''}`;
              if (seen.has(uniqKey)) return;
              seen.add(uniqKey);
              rows.push({
                tipoMovto: 'Inclusão',
                codUSeg: '',
                numeroSequencial: '',
                codigoFamilia: '',
                relacaoDep: (form?.relacaoDep || (raw.benRelacaoDep === '00' ? 'titular' : 'dependente') || ''),
                digito: '',
                dataNascimento: form?.dataNascimento || (raw.benDtaNasc || ''),
                sexo: form?.sexo || (raw.benSexo || ''),
                estadoCivil: form?.estadoCivil || (raw.benEstCivil || ''),
                dataInclusao: form?.dataInclusaoExclusao || fmt(di),
                dataExclusao: fmt(de),
                planoProd: form?.planoProd || (raw.benPlanoProd || ''),
                nomeSegurado: form?.nomeSegurado || (raw.benNomeSegurado || raw.nome || ''),
                cpf: form?.cpf || (raw.benCpf || raw.cpf || ''),
                cidade: form?.cidade || (raw.benCidade || ''),
                uf: form?.uf || (raw.benUf || ''),
                admissao: form?.admissao || (raw.benAdmissao || ''),
                nomeMae: form?.nomeMae || (raw.benNomeDaMae || ''),
                endereco: form?.endereco || (raw.benEndereco || ''),
                numero: form?.numero || (raw.benNumero || ''),
                complemento: form?.complemento || (raw.benComplemento || ''),
                bairro: form?.bairro || (raw.benBairro || ''),
                cep: form?.cep || (raw.benCep || ''),
                pisPasep: form?.pisPasep || '',
                matricula: form?.matricula || (raw.benMatricula || ''),
                lotacaoFuncionario: form?.lotacaoFuncionario || '',
                declaracaoNascidoVivo: form?.declaracaoNascidoVivo || '',
                cns: form?.cns || '',
                dddCelular: form?.dddCelular || (raw.benDddCel || ''),
                receberComunicacaoEmail: form?.receberComunicacaoEmail || '',
                celular: form?.celular || '',
                email: form?.email || (raw.benEmail || ''),
                motivoExclusao: form?.motivoExclusao || '',
                cidadeResidencia: form?.cidadeResidencia || '',
                ufResidencia: form?.ufResidencia || '',
                codigoEmpresa: form?.codigoEmpresa || (raw.codigoEmpresa ?? empresa.codigoEmpresa ?? ''),
                numeroEmpresa: form?.numeroEmpresa || (empresa.numeroEmpresa || '')
              });
              });
          });
          this.rows = rows;
          const set = new Set<string>([...this.knownPlanos, ...rows.map(r => r.planoProd).filter(Boolean)]);
          this.planosDisponiveis = Array.from(set).sort();
          this.updateStats();
        });
      },
      error: () => {
        this.rows = [];
      }
    });
  }

  get filtered(): ReportRow[] {
    const t = (this.filtroTermo || '').toLowerCase();
    const base = this.rows.filter(r =>
      (!t || (r.nomeSegurado || '').toLowerCase().includes(t) || (r.cpf || '').toLowerCase().includes(t) || (r.matricula || '').toLowerCase().includes(t) || (r.codigoEmpresa || '').toLowerCase().includes(t)) &&
      (!this.selectedRelacaoDep || (r.relacaoDep || '') === this.selectedRelacaoDep) &&
      (!this.selectedPlanoProd || (r.planoProd || '') === this.selectedPlanoProd)
    );
    return base;
  }

  downloadCsv() {
    const headers = [
      'Tipo Movto',
      "Cód U' Seg",
      'Numero Sequencial',
      'Código Família',
      'Relação Dep.',
      'Dígito',
      'Data Nascimento',
      'Sexo',
      'Estado Civil',
      'Data Inclusão',
      'Data Exclusão',
      'Plano/ Prod',
      'Nome Segurado',
      'CPF',
      'Cidade',
      'UF',
      'Admissão',
      'Nome da Mãe',
      'Endereço',
      'Número',
      'Complemento',
      'Bairro',
      'CEP',
      'PIS/PASEP',
      'Matricula',
      'Lotação do Func.',
      'Declaração Nascido Vivo',
      'Cartão Nacional de Saúde',
      'DDD Celular',
      'Receber comunicação por email?',
      'Celular',
      'E-mail',
      'Motivo Exclusão',
      'Cidade Residencia',
      'UF Residencia',
      'Código Empresa',
      'Número Empresa'
    ];

    const colStyles: string[] = [
      'background:#66a3c7;color:#fff;font-weight:700',
      'color:#e11d2e;font-weight:700',
      'color:#e11d2e;font-weight:700',
      'color:#e11d2e;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'color:#e11d2e;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'color:#e11d2e;font-weight:700',
      'background:#cbd5e1;color:#1f2937;font-weight:700',
      'background:#cbd5e1;color:#1f2937;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'color:#e11d2e;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'color:#e11d2e;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700',
      'background:#66a3c7;color:#fff;font-weight:700'
    ];

    const widthPx: number[] = [120,110,140,130,120,90,120,80,110,120,120,120,180,120,120,60,120,160,200,90,140,120,110,120,120,160,160,90,200,120,160,160,140,160,120,140,120];
    const asTextCols = new Set([13,22,23,24,27,28,29]);

    const escapeHtml = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    let html = '<html><head><meta charset="utf-8"></head><body><table border="1" cellspacing="0" cellpadding="4">';
    html += '<tr>' + headers.map((h, i) => `<td style="${colStyles[i]};width:${widthPx[i]}px">${escapeHtml(h)}</td>`).join('') + '</tr>';
    for (const r of this.filtered) {
      const vals = [
        r.tipoMovto,
        r.codUSeg,
        r.numeroSequencial,
        r.codigoFamilia,
        r.relacaoDep,
        r.digito,
        r.dataNascimento,
        r.sexo,
        r.estadoCivil,
        r.dataInclusao,
        r.dataExclusao,
        r.planoProd,
        r.nomeSegurado,
        r.cpf,
        r.cidade,
        r.uf,
        r.admissao,
        r.nomeMae,
        r.endereco,
        r.numero,
        r.complemento,
        r.bairro,
        r.cep,
        r.pisPasep,
        r.matricula,
        r.lotacaoFuncionario,
        r.declaracaoNascidoVivo,
        r.cns,
        r.dddCelular,
        r.receberComunicacaoEmail,
        r.celular,
        r.email,
        r.motivoExclusao,
        r.cidadeResidencia,
        r.ufResidencia,
        r.codigoEmpresa,
        r.numeroEmpresa
      ];
      html += '<tr>' + vals.map((v, i) => `<td style="${asTextCols.has(i) ? 'mso-number-format:\'@\';' : ''}width:${widthPx[i]}px">${escapeHtml(v || '')}</td>`).join('') + '</tr>';
    }
    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-inclusoes.xls';
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadExcel() { this.downloadCsv(); }

  onSearch() { /* two-way binding updates */ }
  onRelacaoChange() { /* two-way binding updates */ }
  onPlanoChange() { /* two-way binding updates */ }
  clearFilters() { this.filtroTermo = ''; this.selectedRelacaoDep = ''; this.selectedPlanoProd = ''; }
  private updateStats() {
    const total = this.rows.length;
    const inclusoes = this.rows.filter(r => !!r.dataInclusao).length;
    const exclusoes = this.rows.filter(r => !!r.dataExclusao).length;
    this.stats = { total, inclusoes, exclusoes };
  }
}
