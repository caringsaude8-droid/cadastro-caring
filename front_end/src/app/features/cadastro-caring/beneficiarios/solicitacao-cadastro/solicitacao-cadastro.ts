import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AprovacaoService, Solicitacao } from '../../gestao-cadastro/aprovacao.service';
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

  constructor(
    private aprovacao: AprovacaoService, 
    private auth: AuthService,
    private empresaContextService: EmpresaContextService,
    private beneficiariosService: BeneficiariosService
  ) {}

  ngOnInit(): void {
    // Obter usuário atual
    const user = this.auth.getCurrentUser();
    this.currentUser = user?.nome || 'Usuário';

    // Obter empresa selecionada
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();

    // Sincronizar lista de solicitações com a API
    this.aprovacao.atualizarSolicitacoes();
    // Assinar Observable para atualizar lista automaticamente
    this.solicitacoesSub = this.aprovacao.solicitacoes$.subscribe(solicitacoes => {
      this.solicitacoes = solicitacoes;
      this.loading = false;
    });
      if (this.solicitacoesSub) {
        this.solicitacoesSub.unsubscribe();
      }
  }
  
  carregarSolicitacoes(): void {
    this.loading = true;
    this.solicitacoes = this.aprovacao.list();
    
    console.log('🔍 Carregando solicitações:');
    console.log('  - Total de solicitações:', this.solicitacoes.length);
    console.log('  - Usuário atual:', this.currentUser);
    console.log('  - Empresa selecionada:', this.empresaSelecionada);
    console.log('  - Minhas solicitações:', this.minhasSolicitacoes.length);
    
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
  }

  get minhasSolicitacoes(): Solicitacao[] {
    const filtered = this.solicitacoes.filter(s => {
      // Filtrar por empresa (mais flexível para mostrar todas as solicitações da empresa)
      const currentUserName = this.auth.getCurrentUser()?.nome || this.currentUser;
      const isMyCompany = !this.empresaSelecionada || 
                         !s.codigoEmpresa || 
                         s.codigoEmpresa === this.empresaSelecionada.codigoEmpresa ||
                         s.codigoEmpresa === String(this.empresaSelecionada.id);
      
      console.log(`📋 Solicitação ${s.id}:`, {
        solicitante: s.solicitante,
        currentUserName,
        codigoEmpresa: s.codigoEmpresa,
        empresaSelecionada: this.empresaSelecionada?.codigoEmpresa,
        empresaId: this.empresaSelecionada?.id,
        isMyCompany,
        incluir: isMyCompany
      });
      
      return isMyCompany;
    });
    
    return filtered;
  }

  canEditar(s: Solicitacao): boolean { return s.status === 'pendente'; }

  shouldShowAjustes(s: Solicitacao): boolean {
    return s.status === 'aguardando' && !!(s.observacao && s.observacao.trim());
  }

  openDetails(s: Solicitacao) {
    this.selected = s;
    if (!this.ajustes[s.id]) this.ajustes[s.id] = { mensagem: '', anexos: [], docTipo: '' };
    this.showDetails = true;
  }

  closeDetails() {
    this.showDetails = false;
    this.selected = null;
  }

  salvarAjustes(s: Solicitacao) {
    const state = this.ensureAjusteState(s.id);
    const texto = state.mensagem || '';
    const user = this.auth.getCurrentUser();
    const author = user?.nome || 'Solicitante';
    const obs = [texto ? `${author}: ${texto}` : '', `(${state.anexos.length} documento(s) anexado(s))`]
      .filter(Boolean)
      .join(' • ');
    this.aprovacao.updateStatus(s.id, 'pendente', obs);
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

  private ensureAjusteState(id: string) {
    if (!this.ajustes[id]) this.ajustes[id] = { mensagem: '', anexos: [], docTipo: '' };
    return this.ajustes[id];
  }

  private keyFor(id: string) { return `solicitacaoAjustes:${id}`; }
}
