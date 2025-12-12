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

type Anexo = { tipo: string; nome: string; size: number; dataUrl: string };

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

  constructor(
    private aprovacao: AprovacaoService, 
    private auth: AuthService,
    private empresaContextService: EmpresaContextService,
    private beneficiariosService: BeneficiariosService,
    private solicitacaoBeneficiarioService: SolicitacaoBeneficiarioService,
    private router: Router
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
    this.solicitacaoBeneficiarioService.listarTodasPorEmpresa(this.empresaSelecionada.id)
      .subscribe((solicitacoes: any[]) => {
        if (solicitacoes && solicitacoes.length > 0) {
        }
        // Mapeia os campos para o front
          const mapeadas = solicitacoes.map(s => ({
            ...s,
            tipo: (s.tipo || '').toLowerCase(),
            status: mapStatus(s.status),
            descricao: s.beneficiarioNome || s.descricao || '',
            identificador: s.beneficiarioCpf || s.identificador || '',
            data: s.dataSolicitacao || s.data || '',
            historico: s.historico || []
          }));

          // Ordenar solicitações por data (nova para velha)
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
        this.solicitacoes = mapeadas.sort((a, b) => toTime(b.data) - toTime(a.data));
        // Função utilitária para mapear status do backend para o front
        function mapStatus(status: string): string {
          const map: Record<string, string> = {
            'PENDENTE': 'pendente',
            'APROVADA': 'concluida',
            'REJEITADA': 'aguardando',
            'CANCELADA': 'aguardando'
          };
          return map[status?.toUpperCase?.()] || 'pendente';
        }
        // Inicializar ajustes para minhas solicitações
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
      }, (err) => {
        console.error('[API] erro ao buscar solicitações:', err);
        this.solicitacoes = [];
        this.loading = false;
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
              if (!d) return new Date().toISOString();
              if (d instanceof Date) return d.toISOString();
              if (typeof d === 'string') return d;
              try { return new Date(d).toISOString(); } catch { return new Date().toISOString(); }
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
    const payload = { dadosPropostos };
    
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
