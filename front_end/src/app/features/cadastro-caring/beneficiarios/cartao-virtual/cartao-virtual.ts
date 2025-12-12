import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EmpresaContextService } from '../../../../shared/services/empresa-context.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-cartao-virtual',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './cartao-virtual.html',
  styleUrl: './cartao-virtual.css'
})
export class CartaoVirtualComponent implements OnInit {
  @Input() embedded = false;
  @Input() nome = '';
  @Input() cpf = '';
  @Input() matricula = '';
  @Input() acomodacao = '';
  @Input() plano = '';
  @Input() empresa = '';
  @Input() codigoEmpresa = '';
  @Input() numeroProduto = '';
  @Input() vigencia = '';
  @Input() abrangencia = '';
  @Input() cpt = '';
  @Input() redeAtendimento = '';
  @Input() segmentacao = '';
  @Input() atend = '';
  @Input() via = '';
  @Input() dataNasc = '';
  @Input() codProdutoAns = '';
  @Input() logoUrl = '';
  autoDownload = false;

  constructor(private route: ActivatedRoute, private empresaContextService: EmpresaContextService) {}

  private mapearPlanoLabel(codigo: string): string {
    const m: { [key: string]: string } = {
      'ADMDTXCP': 'UNIMED ADM. DINAMICO',
      'ADMBTXCP': 'UNIMED ADM. BÁSICO'
    };
    return m[(codigo || '').toUpperCase()] || '';
  }
  private mapearRedeAtendimento(planoLabel: string): string {
    const normalize = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const p = normalize(planoLabel);
    if (!p) return '';
    if (p.includes('adm') && p.includes('dinamico')) return 'NA07 Especial';
    if ((p.includes('administrado') || p.includes('administrativo')) && p.includes('basico')) return 'NA06 Básico';
    return '';
  }

  ngOnInit(): void {
    if (this.embedded) return;
    this.route.queryParamMap.subscribe(params => {
      this.nome = params.get('nome') || '';
      this.cpf = params.get('cpf') || '';
      this.matricula = params.get('matricula_beneficiario') || params.get('matricula') || '';
      this.acomodacao = params.get('acomodacao') || '';
      this.plano = params.get('plano') || '';
      this.plano = this.mapearPlanoLabel(this.plano) || this.plano;
      // Buscar nome da empresa vinculada ao beneficiário
      const empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();
      this.empresa = empresaSelecionada?.nome || params.get('empresa') || '';
      this.codigoEmpresa = params.get('codigoEmpresa') || '';
      this.numeroProduto = params.get('numeroProduto') || '';
      this.vigencia = params.get('vigencia') 
        || params.get('benDtaInclusao') 
        || params.get('dataInclusao') 
        || '';
      this.abrangencia = params.get('abrangencia') || '';
      this.cpt = params.get('cpt') || '';
      const redeMapeada = this.mapearRedeAtendimento(this.plano);
      this.redeAtendimento = redeMapeada || (params.get('rede') || '');
      this.segmentacao = params.get('segmentacao') || '';
      this.atend = params.get('atend') 
        || params.get('benCodUnimedSeg') 
        || params.get('codUnimedSeg') 
        || params.get('cod_unimed_seg') 
        || '';
      this.via = params.get('via') || '';
      this.dataNasc = params.get('dataNasc') || '';
      this.codProdutoAns = params.get('codProdutoAns') || '494413235';
      const defaultLogo = '/assets/logo%20unimed%20seguros.png';
      this.logoUrl = params.get('logoUrl') || defaultLogo;
      this.autoDownload = (params.get('autoDownload') || '') === '1';
      if (this.autoDownload) { setTimeout(() => this.downloadPdf(), 300); }
    });
  }

  get cpfMasked(): string {
    const d = (this.cpf || '').replace(/\D/g, '').slice(0, 11);
    if (d.length !== 11) return this.cpf;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  }

  // método de imprimir removido

  async downloadPdf() {
    const el = document.querySelector('.cards-grid') as HTMLElement | null;
    if (!el) return;
    const html2canvasMod = await import('html2canvas');
    const jspdfMod = await import('jspdf');
    const html2canvas = html2canvasMod.default;
    const { jsPDF } = jspdfMod as any;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageMargin = 10;
    const imgWidth = pageWidth - pageMargin * 2;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    pdf.addImage(imgData, 'PNG', pageMargin, pageMargin, imgWidth, imgHeight);
    const file = this.nome ? `cartao-${this.nome}.pdf` : 'cartao-virtual.pdf';
    pdf.save(file);
  }
}
