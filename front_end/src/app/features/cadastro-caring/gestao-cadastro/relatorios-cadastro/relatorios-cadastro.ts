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
  relacaoDepLabel?: string;
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
              const diStr = raw.benDtaInclusao || '';
              const deStr = raw.benDtaExclusao || '';
              const uniqKey = `${(raw.benCpf || raw.cpf || '')}-${raw.benEmpId ?? raw.empresaId ?? raw.empId ?? empresaId ?? ''}-${raw.codigoEmpresa ?? empresaCodigo ?? ''}`;
              if (seen.has(uniqKey)) return;
              seen.add(uniqKey);
              const dataIncl = this.normalizeDateStr(form?.dataInclusaoExclusao || diStr);
              const dataExcl = this.normalizeDateStr(deStr);
              const tipo = dataExcl ? 'E' : (dataIncl ? 'I' : '');
              const relRaw = String(raw.benRelacaoDep ?? '').trim();
              const relacaoDepCodigo = relRaw ? relRaw.padStart(2, '0') : (((form?.relacaoDep || '').toLowerCase() === 'titular') ? '00' : '');
              rows.push({
                tipoMovto: tipo,
                codUSeg: raw.benCodUnimedSeg || raw.cod_unimed_seg || '',
                numeroSequencial: '',
                codigoFamilia: '',
                relacaoDep: relacaoDepCodigo,
                relacaoDepLabel: this.labelRelacaoDep(relacaoDepCodigo),
                digito: '',
                dataNascimento: form?.dataNascimento || (raw.benDtaNasc || ''),
                sexo: form?.sexo || (raw.benSexo || ''),
                estadoCivil: form?.estadoCivil || (raw.benEstCivil || ''),
                dataInclusao: dataIncl,
                dataExclusao: dataExcl,
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
                cep: this.normalizeCep(form?.cep || raw.benCep || ''),
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
      (!this.selectedRelacaoDep ||
        (this.selectedRelacaoDep === 'titular' ? (r.relacaoDep === '00') :
         (this.selectedRelacaoDep === 'dependente' ? (r.relacaoDep !== '00' && !!r.relacaoDep) : true))) &&
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
    const asTextCols = new Set([2,3,4,13,22,23,24,26,27,28,30,35,36]);
    const clipCols = new Set([12,31]);
    const centerCols = new Set([6,9,10,16]);

    const escapeHtml = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    let html = '<html><head><meta charset="utf-8"><style>table{table-layout:fixed} td{white-space:nowrap} .clip{display:block;white-space:nowrap;overflow:hidden}</style></head><body><table border="1" cellspacing="0" cellpadding="4">';
    html += '<tr>' + headers.map((h, i) => `<td style="${colStyles[i]};width:${widthPx[i]}px;mso-height-source:userset;height:40px;padding-top:12px;padding-bottom:12px;text-align:center;vertical-align:middle"><div class="clip" style="width:100%;text-align:center">${escapeHtml(h)}</div></td>`).join('') + '</tr>';
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
      html += '<tr>' + vals.map((v, i) => {
        const raw = (v || '').toString().replace(/<br\s*\/?>/gi, ' ').replace(/\r?\n|\r/g, ' ');
        const inner = `<div class="clip" style="width:100%">${escapeHtml(raw)}</div>`;
        const align = centerCols.has(i) ? 'text-align:center;' : '';
        return `<td style="${align}${asTextCols.has(i) ? 'mso-number-format:\'@\';' : ''}width:${widthPx[i]}px">${inner}</td>`;
      }).join('') + '</tr>';
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
  private labelRelacaoDep(code: string): string {
    const s = String(code || '').trim();
    if (!s) return 'Dependente';
    const n = parseInt(s, 10);
    if (isNaN(n)) return 'Dependente';
    if (n === 0) return 'Titular';
    if (n === 1) return 'Esposa';
    if (n === 2) return 'Companheira(o)';
    if (n === 9) return 'Marido';
    if (n >= 5 && n <= 8) return 'Menor sob guarda ou tutela';
    if (n >= 10 && n <= 20) return 'Filhos';
    if (n >= 21 && n <= 25) return 'Filho maior';
    if (n >= 30 && n <= 40) return 'Filhas';
    if (n >= 41 && n <= 45) return 'Filha maior';
    if (n === 50) return 'Pai';
    if (n === 51) return 'Mãe';
    if (n === 52) return 'Sogro';
    if (n === 53) return 'Sogra';
    if (n >= 60 && n <= 69) return 'Dependente legal (masculino)';
    if (n >= 70 && n <= 74) return 'Filho adotivo';
    if (n >= 75 && n <= 79) return 'Filha adotiva';
    if (n >= 80 && n <= 84) return 'Irmão';
    if (n >= 85 && n <= 89) return 'Irmã';
    if (n >= 90 && n <= 94) return 'Outros dependentes (masculino)';
    if (n >= 95 && n <= 99) return 'Outros dependentes (feminino)';
    return 'Dependente';
  }
  private normalizeDateStr(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      const d = value;
      const dd = ('0' + d.getDate()).slice(-2);
      const mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const yyyy = d.getFullYear();
      if (!yyyy || isNaN(yyyy)) return '';
      return `${dd}/${mm}/${yyyy}`;
    }
    const s = String(value).trim();
    const m1 = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    if (m1) {
      const dd = parseInt(m1[1], 10), mm = parseInt(m1[2], 10), yyyy = parseInt(m1[3], 10);
      if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return '';
      return `${('0' + dd).slice(-2)}/${('0' + mm).slice(-2)}/${yyyy}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      if (isNaN(d.getTime())) return '';
      const dd = ('0' + d.getDate()).slice(-2);
      const mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return '';
  }
  private normalizeCep(value: any): string {
    const s = String(value ?? '').trim();
    if (!s) return '';
    const digits = s.replace(/\D/g, '');
    if (!digits) return s;
    return digits.padStart(8, '0');
  }
}
