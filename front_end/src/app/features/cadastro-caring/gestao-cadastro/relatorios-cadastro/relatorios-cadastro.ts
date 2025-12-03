import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { BeneficiariosService } from '../../beneficiarios/beneficiarios.service';

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
  dataInclusaoExclusao: string;
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

  constructor(private beneficiarios: BeneficiariosService) {}

  ngOnInit(): void {
    const list = this.beneficiarios.list();
    const mapped: ReportRow[] = [];
    let codigoEmpresaDefault = '';
    try {
      const selected = localStorage.getItem('selectedClinic');
      const clinica = selected ? JSON.parse(selected) : null;
      codigoEmpresaDefault = clinica?.codigo || '';
    } catch {}
    const fmt = (d: Date | null) => {
      if (!d) return '';
      const dd = ('0' + d.getDate()).slice(-2);
      const mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    // Usar subscribe para trabalhar com Observable
    list.subscribe(beneficiarios => {
      for (const b of beneficiarios) {
        const key = `inclusaoDetalhe:${b.cpf}`;
        const raw = localStorage.getItem(key);
        let form: ReportForm | null = null;
        try { form = raw ? (JSON.parse(raw) as ReportForm) : null; } catch { form = null; }
      mapped.push({
        tipoMovto: 'Inclusão',
        codUSeg: '',
        numeroSequencial: '',
        codigoFamilia: '',
        relacaoDep: (form?.relacaoDep || b.tipo_dependencia || ''),
        digito: '',
        dataNascimento: form?.dataNascimento || (b.nascimento || ''),
        sexo: form?.sexo || '',
        estadoCivil: form?.estadoCivil || '',
        dataInclusaoExclusao: form?.dataInclusaoExclusao || fmt(b.data_inclusao || null),
        planoProd: form?.planoProd || (b.acomodacao || ''),
        nomeSegurado: form?.nomeSegurado || (b.nome || ''),
        cpf: form?.cpf || b.cpf || '',
        cidade: form?.cidade || '',
        uf: form?.uf || '',
        admissao: form?.admissao || '',
        nomeMae: form?.nomeMae || '',
        endereco: form?.endereco || '',
        numero: form?.numero || '',
        complemento: form?.complemento || '',
        bairro: form?.bairro || '',
        cep: form?.cep || '',
        pisPasep: form?.pisPasep || '',
        matricula: form?.matricula || b.matricula_beneficiario || '',
        lotacaoFuncionario: form?.lotacaoFuncionario || '',
        declaracaoNascidoVivo: form?.declaracaoNascidoVivo || '',
        cns: form?.cns || '',
        dddCelular: form?.dddCelular || '',
        receberComunicacaoEmail: form?.receberComunicacaoEmail || '',
        celular: form?.celular || '',
        email: form?.email || '',
        motivoExclusao: form?.motivoExclusao || '',
        cidadeResidencia: form?.cidadeResidencia || '',
        ufResidencia: form?.ufResidencia || '',
        codigoEmpresa: form?.codigoEmpresa || codigoEmpresaDefault,
        numeroEmpresa: form?.numeroEmpresa || (b.matricula_titular || '')
      });
      }
      this.rows = mapped;
    });
  }

  get filtered(): ReportRow[] {
    const t = (this.filtroTermo || '').toLowerCase();
    if (!t) return this.rows;
    return this.rows.filter(r =>
      (r.nomeSegurado || '').toLowerCase().includes(t) ||
      (r.cpf || '').toLowerCase().includes(t) ||
      (r.matricula || '').toLowerCase().includes(t) ||
      (r.codigoEmpresa || '').toLowerCase().includes(t)
    );
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
      'Data Inclusão / Exclusão',
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

    const widthPx: number[] = [120,110,140,130,120,90,120,80,110,160,120,180,120,120,60,120,160,200,90,140,120,110,120,120,160,160,90,200,120,160,160,140,160,120,140];
    const asTextCols = new Set([12,21,22,23,26,27,28]);

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
        r.dataInclusaoExclusao,
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
}
