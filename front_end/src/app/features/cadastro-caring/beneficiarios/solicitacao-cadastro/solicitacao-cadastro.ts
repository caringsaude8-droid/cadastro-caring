import { Component, OnInit } from '@angular/core';
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

  constructor(
    private aprovacao: AprovacaoService, 
    private auth: AuthService,
    private empresaContextService: EmpresaContextService,
    private beneficiariosService: BeneficiariosService,
    private solicitacaoBeneficiarioService: SolicitacaoBeneficiarioService
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
        console.log('[API] solicitações recebidas (todas):', solicitacoes);
        // Mapeia os campos para o front
        const mapeadas = solicitacoes.map(s => ({
          ...s,
          tipo: (s.tipo || '').toLowerCase(),
          status: mapStatus(s.status),
          descricao: s.beneficiarioNome || s.descricao || '',
          identificador: s.beneficiarioCpf || s.identificador || '',
          data: s.dataSolicitacao || s.data || '',
        }));
        this.solicitacoes = mapeadas;
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
