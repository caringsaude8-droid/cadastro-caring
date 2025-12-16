import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AprovacaoService, Solicitacao } from '../../gestao-cadastro/aprovacao.service';
import { SolicitacaoBeneficiarioService } from '../../gestao-cadastro/solicitacao-beneficiario.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { EmpresaContextService } from '../../../../shared/services/empresa-context.service';
import { BeneficiariosService } from '../beneficiarios.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type Anexo = { id?: number; tipo: string; nome: string; size: number; dataUrl: string };

@Component({
  selector: 'app-solicitacao-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './solicitacao-cadastro.html',
  styleUrl: './solicitacao-cadastro.css'
})
export class SolicitacaoCadastroComponent implements OnInit {
  solicitacoes: Solicitacao[] = [];
  solicitacoesSub: any;
  currentUser = '';
  empresaSelecionada: any = null;
  ajustes: Record<string, { mensagem: string; anexos: Anexo[]; docTipo: string }> = {};
  showDetails = false;
  selected: Solicitacao | null = null;
  loading = false;
  selectedDadosPropostos: Array<{ key: string; value: any }> = [];
  historicoCompleto: { valorNovo: string; usuarioNome: string; dataOperacao: string }[] = [];
  showBenefDetails = false;
  benefDetalhes: any = null;
  showInclusaoDetails = false;
  dadosDetalhes: any = null;
  private readonly MAX_FILE_SIZE = 5242880;
  showAnexoPreview = false;
  anexoPreviewUrl: SafeResourceUrl | string = '';
  anexoPreviewNome = '';
  anexoPreviewTipo = '';

  constructor(
    private aprovacao: AprovacaoService, 
    private auth: AuthService,
    private empresaContextService: EmpresaContextService,
    private beneficiariosService: BeneficiariosService,
    private solicitacaoBeneficiarioService: SolicitacaoBeneficiarioService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Obter usuário atual
    const user = this.auth.getCurrentUser();
    this.currentUser = user?.nome || 'Usuário';

    // Obter empresa selecionada
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();

    // Carregar solicitações da empresa selecionada
    this.carregarSolicitacoes();
  }
  
  carregarSolicitacoes(): void {
    if (!this.empresaSelecionada || !this.empresaSelecionada.id) {
      this.solicitacoes = [];
      return;
    }
    this.loading = true;
    const toIso = (d: any): string => {
      try {
        if (!d) return new Date().toISOString();
        if (d instanceof Date) return d.toISOString();
        if (typeof d === 'string') {
          const m1 = d.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
          if (m1) {
            const dia = parseInt(m1[1], 10);
            const mes = parseInt(m1[2], 10) - 1;
            const ano = parseInt(m1[3], 10);
            const hora = m1[4] ? parseInt(m1[4], 10) : 0;
            const min = m1[5] ? parseInt(m1[5], 10) : 0;
            const seg = m1[6] ? parseInt(m1[6], 10) : 0;
            return new Date(ano, mes, dia, hora, min, seg).toISOString();
          }
          const dt = new Date(d);
          return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
        }
        if (typeof d === 'number') return new Date(d).toISOString();
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
      } catch { return new Date().toISOString(); }
    };
    const toTime = (d: any): number => {
      try {
        if (!d) return 0;
        if (d instanceof Date) return d.getTime();
        if (typeof d === 'string') {
          const dt = new Date(d);
          return isNaN(dt.getTime()) ? 0 : dt.getTime();
        }
        if (typeof d === 'number') return d;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? 0 : dt.getTime();
      } catch { return 0; }
    };
    const mapStatus = (status: string): string => {
      const map: Record<string, string> = {
        'PENDENTE': 'pendente',
        'APROVADA': 'concluida',
        'REJEITADA': 'aguardando',
        'CANCELADA': 'aguardando'
      };
      return map[status?.toUpperCase?.()] || 'pendente';
    };
    const mapear = (solicitacoes: any[]) => solicitacoes.map(s => ({
      ...s,
      tipo: (s.tipo || '').toLowerCase(),
      status: mapStatus(s.status),
      descricao: s.beneficiarioNome || s.descricao || '',
      identificador: s.beneficiarioCpf || s.identificador || '',
      data: toIso(s.dataSolicitacao || s.data || ''),
      historico: s.historico || []
    })).sort((a, b) => toTime(b.data) - toTime(a.data));
    const cached = this.solicitacaoBeneficiarioService.getCached();
    if (Array.isArray(cached) && cached.length > 0) {
      this.solicitacoes = mapear(cached);
    }
    this.solicitacaoBeneficiarioService.refresh(this.empresaSelecionada.id).subscribe({
      next: (lista) => {
        this.solicitacoes = mapear(lista);
        for (const s of this.minhasSolicitacoes) {
          const saved = localStorage.getItem(this.keyFor(s.id));
          if (saved) {
            try { 
              this.ajustes[s.id] = JSON.parse(saved); 
            } catch { 
              this.ajustes[s.id] = { mensagem: '', anexos: [], docTipo: '' }; 
            }
          } else {
            this.ajustes[s.id] = { mensagem: '', anexos: [], docTipo: '' };
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('[API] erro ao buscar solicitações:', err);
        if (!Array.isArray(cached) || cached.length === 0) {
          this.solicitacoes = [];
        }
        this.loading = false;
      }
    });
  }

  get minhasSolicitacoes(): Solicitacao[] {
    // As solicitações já vêm filtradas por empresa do serviço
    return this.solicitacoes;
  }

  canEditar(s: Solicitacao): boolean { return s.status === 'pendente'; }

  shouldShowAjustes(s: Solicitacao): boolean {
    return s.status === 'aguardando' && !!(s.observacao && s.observacao.trim());
  }

  openDetails(s: Solicitacao) {
    this.selected = s;
    this.historicoCompleto = [];
    if (!this.ajustes[s.id]) this.ajustes[s.id] = { mensagem: '', anexos: [], docTipo: '' };
    // Extrai os dados propostos diretamente do JSON, se existir
    let dadosPropostos: any = {};
    if (s.dadosJson) {
      try {
        dadosPropostos = JSON.parse(s.dadosJson);
      } catch {}
    }
    // Exibe apenas os valores dos campos propostos, sem nomes amigáveis
    this.selectedDadosPropostos = Object.entries(dadosPropostos)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([_, value]) => ({ key: '', value }));
    this.showDetails = true;
    const idNum = parseInt(s.id);
    if (!isNaN(idNum)) {
      
      this.solicitacaoBeneficiarioService.listarHistorico(idNum).subscribe({
        next: (lista: any[]) => {
          try {
            
            const toIso = (d: any): string => {
              try {
                if (!d) return new Date().toISOString();
                if (d instanceof Date) return d.toISOString();
                if (typeof d === 'string') {
                  const m1 = d.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
                  if (m1) {
                    const dia = parseInt(m1[1], 10);
                    const mes = parseInt(m1[2], 10) - 1;
                    const ano = parseInt(m1[3], 10);
                    const hora = m1[4] ? parseInt(m1[4], 10) : 0;
                    const min = m1[5] ? parseInt(m1[5], 10) : 0;
                    const seg = m1[6] ? parseInt(m1[6], 10) : 0;
                    return new Date(ano, mes, dia, hora, min, seg).toISOString();
                  }
                  const m2 = d.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?$/);
                  if (m2) {
                    const ano = parseInt(m2[1], 10);
                    const mes = parseInt(m2[2], 10) - 1;
                    const dia = parseInt(m2[3], 10);
                    const hora = parseInt(m2[4], 10);
                    const min = parseInt(m2[5], 10);
                    const seg = m2[6] ? parseInt(m2[6], 10) : 0;
                    return new Date(ano, mes, dia, hora, min, seg).toISOString();
                  }
                  const dt = new Date(d);
                  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
                }
                if (typeof d === 'number') return new Date(d).toISOString();
                const dt = new Date(d);
                return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
              } catch { return new Date().toISOString(); }
            };
            const m = (e: any) => ({
              valorNovo: String(e?.valorNovo ?? ''),
              usuarioNome: String(e?.usuarioNome ?? ''),
              dataOperacao: toIso(e?.dataOperacao)
            });
            const mapped = Array.isArray(lista) ? lista.map(m) : [];
            this.historicoCompleto = mapped.sort((a, b) => new Date(b.dataOperacao).getTime() - new Date(a.dataOperacao).getTime());
            
          } catch {}
        },
        error: () => {}
      });

      this.solicitacaoBeneficiarioService.buscarPorId(idNum).subscribe({
        next: (resp: any) => {
          try {
            // Tenta recuperar anexos do JSON se não vierem estruturados ou estiverem incompletos
            let anexosDoJson: any[] = [];
            try {
              const dadosObj = resp?.dadosJson ? JSON.parse(resp.dadosJson) : null;
              if (dadosObj && Array.isArray(dadosObj.anexos)) {
                anexosDoJson = dadosObj.anexos;
              }
            } catch (e) { console.warn('Erro ao parsear anexos do JSON:', e); }

            if (this.selected) {
              // Prioriza anexos da API estruturada se tiverem ID, senão tenta completar com os do JSON (base64)
              const anexosApi = (resp.anexos && Array.isArray(resp.anexos)) ? resp.anexos : [];
              
              if (anexosApi.length > 0) {
                this.selected.anexos = anexosApi.map((a: any) => {
                  // Tenta encontrar o correspondente no JSON para pegar o base64 se o ID estiver faltando
                  const matchJson = anexosDoJson.find((aj: any) => aj.nomeOriginal === (a.nomeOriginal || a.nome));
                  
                  return {
                    id: a.id || a.anexoId || a.codigo || a.arquivoId,
                    tipo: a.tipoMime || a.tipo || 'Desconhecido',
                    nome: a.nomeOriginal || a.nome || 'Anexo',
                    size: a.tamanho || a.size || 0,
                    dataUrl: a.dataUrl || (a.base64 ? `data:${a.tipoMime || 'application/octet-stream'};base64,${a.base64}` : '') 
                             || (matchJson && matchJson.base64 ? `data:${matchJson.tipoMime || 'application/octet-stream'};base64,${matchJson.base64}` : '')
                             || ''
                  };
                });
              } else if (anexosDoJson.length > 0) {
                 // Fallback: usa anexos do JSON se a API não retornou nada na lista estruturada
                 this.selected.anexos = anexosDoJson.map((a: any) => ({
                    id: undefined, // Geralmente não tem ID no JSON
                    tipo: a.tipoMime || 'Desconhecido',
                    nome: a.nomeOriginal || 'Anexo',
                    size: a.tamanho || 0,
                    dataUrl: a.base64 ? `data:${a.tipoMime || 'application/octet-stream'};base64,${a.base64}` : ''
                 }));
              }
            }
            
            const dadosObj = resp?.dadosJson ? JSON.parse(resp.dadosJson) : null;
            const propostos = dadosObj && dadosObj.dadosPropostos ? dadosObj.dadosPropostos : dadosObj;
            this.dadosDetalhes = propostos || this.dadosDetalhes;
            this.enriquecerTitularInfo();
          } catch {}
        },
        error: () => {}
      });
    }

  }

  closeDetails() {
    this.showDetails = false;
    this.selected = null;
  }

  detalharBeneficiario(s: Solicitacao) {
    const cpf = String(s?.identificador || '').replace(/\D/g, '');
    if (!cpf) return;
    this.closeDetails();
    const query = new URLSearchParams({ cpf }).toString();
    this.router.navigateByUrl(`/cadastro-caring/beneficiarios/alteracao-cadastral?${query}`);
  }

  salvarAjustes(s: Solicitacao) {
      
    const state = this.ensureAjusteState(s.id);
    const texto = state.mensagem || '';
    const user = this.auth.getCurrentUser();
    const author = user?.nome || 'Solicitante';
    const obs = [texto ? `${author}: ${texto}` : '', `(${state.anexos.length} documento(s) anexado(s))`]
      .filter(Boolean)
      .join(' • ');

    // Agrupar dados propostos conforme esperado pela API
    let dadosPropostos = {};
    try {
      dadosPropostos = s.dadosPropostos || (s.dadosJson ? JSON.parse(s.dadosJson).dadosPropostos || JSON.parse(s.dadosJson) : {});
    } catch {
      dadosPropostos = {};
    }
    // Garante que o objeto passado é { dadosPropostos: { ... } }
    const anexosPayload = this.convertAnexosToBase64(state.anexos);
    const payload: any = { dadosPropostos, observacoesSolicitacao: obs };
    if (anexosPayload.length > 0) payload.anexos = anexosPayload;
    this.aprovacao.updateStatus(s.id, 'pendente', obs, payload);
    localStorage.setItem(this.keyFor(s.id), JSON.stringify(state));
  }

  salvarAjustesSelecionado() {
    if (!this.selected) return;
    this.salvarAjustes(this.selected);
    this.closeDetails();
  }

  onFileSelected(s: Solicitacao, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    const state = this.ensureAjusteState(s.id);
    if (!file || !state.docTipo) { alert('Selecione o tipo e o arquivo.'); return; }
    if (file.size > this.MAX_FILE_SIZE) { alert('Arquivo excede 5MB'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      state.anexos.push({ tipo: state.docTipo, nome: file.name, size: file.size, dataUrl });
      input.value = '';
      state.docTipo = '';
      localStorage.setItem(this.keyFor(s.id), JSON.stringify(state));
    };
    reader.readAsDataURL(file);
  }

  removerAnexo(s: Solicitacao, idx: number) {
    const state = this.ensureAjusteState(s.id);
    state.anexos.splice(idx, 1);
    localStorage.setItem(this.keyFor(s.id), JSON.stringify(state));
  }

  baixarAnexo(s: Solicitacao, idx: number) {
    const state = this.ensureAjusteState(s.id);
    const a = state.anexos[idx];
    if (!a?.dataUrl) return;
    const link = document.createElement('a');
    link.href = a.dataUrl;
    link.download = a.nome;
    link.click();
  }

  openBenefDetails() {
    const cpf = (this.selected?.identificador || '').replace(/\D/g, '');
    if (!cpf) return;
    this.beneficiariosService.listRaw().subscribe({
      next: (lista: any[]) => {
        const b = lista.find(x => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpf);
        if (b) {
          const codUnimed = b.benCodUnimedSeg || b.cod_unimed_seg || '';
          const codCartao = b.benCodCartao || b.cod_cartao || '';
          this.benefDetalhes = {
            nome: b.benNomeSegurado || b.nome || '',
            cpf: b.benCpf || b.cpf || '',
            nascimento: b.benDtaNasc || b.nascimento || '',
            benStatus: b.benStatus || 'Ativo',
            matricula: b.benMatricula || b.matricula_beneficiario || '',
            endereco: b.benEndereco || b.endereco || '',
            numero: b.benNumero || b.numero || '',
            complemento: b.benComplemento || b.complemento || '',
            bairro: b.benBairro || b.bairro || '',
            cep: b.benCep || b.cep || '',
            celular: b.benDddCel || b.celular || '',
            email: b.benEmail || b.email || '',
            planoProd: b.benPlanoProd || b.plano_prod || '',
            admissao: b.benAdmissao || b.admissao || '',
            benCodUnimedSeg: codUnimed,
            benCodCartao: codCartao
          };
          this.showBenefDetails = true;
        }
      },
      error: () => {}
    });
  }

  closeBenefDetails() {
    this.showBenefDetails = false;
    this.benefDetalhes = null;
  }
  openInclusaoDetails() {
    if (this.selected?.tipo === 'inclusao') {
      if (!this.dadosDetalhes) {
        try {
          const dadosObj = this.selected?.dadosJson ? JSON.parse(this.selected.dadosJson) : null;
          const propostos = dadosObj && dadosObj.dadosPropostos ? dadosObj.dadosPropostos : dadosObj;
          this.dadosDetalhes = propostos || null;
        } catch {}
      }
      this.enriquecerTitularInfo();
      this.showInclusaoDetails = true;
    }
  }
  closeInclusaoDetails() {
    this.showInclusaoDetails = false;
  }
  private async enriquecerTitularInfo() {
    try {
      const d: any = this.dadosDetalhes;
      if (!d) return;
      const isTitular = String(d.benRelacaoDep || '').trim() === '00';
      if (isTitular) return;
      const cpfTitular = (d.benTitularCpf || '').replace(/\D/g, '');
      if (cpfTitular) {
        const lista = await this.beneficiariosService.listRaw().toPromise();
        const titular = lista?.find((x: any) => ((x.cpf || x.benCpf || '').replace(/\D/g, '')) === cpfTitular);
        if (titular) {
          d.benTitularNome = titular.nome || titular.benNomeSegurado || '';
          d.benTitularCpf = titular.cpf || titular.benCpf || '';
          this.dadosDetalhes = { ...d };
        }
      }
    } catch {}
  }

  private ensureAjusteState(id: string) {
    if (!this.ajustes[id]) this.ajustes[id] = { mensagem: '', anexos: [], docTipo: '' };
    return this.ajustes[id];
  }

  private keyFor(id: string) { return `solicitacaoAjustes:${id}`; }
  private convertAnexosToBase64(anexos: Anexo[]): { nomeOriginal: string; base64: string; tipoMime: string; tamanho: number }[] {
    const out: { nomeOriginal: string; base64: string; tipoMime: string; tamanho: number }[] = [];
    for (const a of anexos) {
      if (!a?.dataUrl) continue;
      if (a.size > this.MAX_FILE_SIZE) continue;
      const parts = a.dataUrl.split(',');
      const meta = parts[0] || '';
      const base64 = parts[1] || '';
      const tipoMime = meta.split(';')[0].split(':')[1] || 'application/octet-stream';
      out.push({ nomeOriginal: a.nome, base64, tipoMime, tamanho: a.size });
    }
    return out;
  }

  visualizarAnexoItem(a: any) {
    // Prioridade 1: Buscar do endpoint de stream se tiver ID
    if (a.id !== undefined && a.id !== null && a.id !== 0) {
      this.solicitacaoBeneficiarioService.downloadAnexo(a.id).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const tipo = (a.tipo || blob.type || '').toLowerCase();
          const isPdf = tipo === 'application/pdf' || tipo.includes('pdf');
          const isImage = tipo.startsWith('image/');
          
          if (isImage || isPdf) {
            this.anexoPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
            this.anexoPreviewNome = a.nome;
            this.anexoPreviewTipo = isPdf ? 'pdf' : 'image';
            this.showAnexoPreview = true;
          } else {
            // Abre em nova aba para visualização (o navegador decide se exibe ou baixa)
            window.open(url, '_blank');
            // Revoga a URL depois de um tempo seguro
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        },
        error: (err) => {
          console.error('Erro ao baixar anexo via stream:', err);
          // Tenta fallback para dataUrl se falhar o stream
          if (a.dataUrl) {
            this.abrirDataUrl(a);
          } else {
            alert('Erro ao carregar anexo da API.');
          }
        }
      });
      return;
    }

    // Prioridade 2: Usar conteúdo local (base64) se disponível
    if (a.dataUrl) {
      this.abrirDataUrl(a);
      return;
    }

    console.warn('Falha ao visualizar anexo (sem ID e sem dataUrl):', a);
    alert('Visualização não disponível. O anexo não possui conteúdo local nem ID para busca na API.');
  }

  private abrirDataUrl(a: any) {
    const tipo = (a.tipo || '').toLowerCase(); 
    const isPdf = tipo === 'application/pdf' || tipo.includes('pdf');
    const isImage = tipo.startsWith('image/');
    
    if (isImage || isPdf) {
        this.anexoPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(a.dataUrl);
        this.anexoPreviewNome = a.nome;
        this.anexoPreviewTipo = isPdf ? 'pdf' : 'image';
        this.showAnexoPreview = true;
    } else {
        try {
          const parts = a.dataUrl.split(',');
          const base64 = parts[1];
          const mime = parts[0].split(':')[1].split(';')[0];
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {type: mime});
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } catch (e) {
          const win = window.open();
          if (win) {
             win.document.write('<iframe src="' + a.dataUrl + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
          }
        }
    }
  }

  visualizarAnexo(s: Solicitacao, idx: number) {
    const state = this.ensureAjusteState(s.id);
    this.visualizarAnexoItem(state.anexos[idx]);
  }
  closeAnexoPreview() {
    this.showAnexoPreview = false;
    this.anexoPreviewUrl = '';
    this.anexoPreviewNome = '';
  }

  // Abre o formulário de inclusão para correção de solicitação rejeitada
  corrigirSolicitacao(s: Solicitacao) {
    if (!s.dadosJson) {
      alert('Não há dados propostos para correção nesta solicitação.');
      return;
    }
    let dadosParaPreencher = {};
    try {
      const dadosJsonObj = typeof s.dadosJson === 'string' ? JSON.parse(s.dadosJson) : s.dadosJson;
      dadosParaPreencher = dadosJsonObj.dadosPropostos || dadosJsonObj;
    } catch (e) {
      console.warn('Falha ao extrair dadosPropostos:', e);
      dadosParaPreencher = {};
    }
    this.router.navigate([
      '/cadastro-caring/beneficiarios/inclusao'
    ], {
      state: {
        dados: JSON.stringify(dadosParaPreencher),
        solicitacaoId: s.id,
        modoCorrecao: true
      }
    });
  }
}
