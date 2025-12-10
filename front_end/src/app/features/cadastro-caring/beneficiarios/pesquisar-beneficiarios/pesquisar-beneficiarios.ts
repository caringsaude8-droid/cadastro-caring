import { Component, OnInit } from '@angular/core';
import { BeneficiariosService, Beneficiario } from '../beneficiarios.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputComponent } from '../../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { EmpresaContextService } from '../../../../shared/services/empresa-context.service';
import { AprovacaoService } from '../../gestao-cadastro/aprovacao.service';

type BeneficiarioRow = Beneficiario & {
  status?: string;
  admissao?: string;
  nomeMae?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  pisPasep?: string;
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
  dataCasamento?: string;
  indicadorPessoaTrans?: string;
  nomeSocial?: string;
  identidadeGenero?: string;
  benCodUnimedSeg?: string;
  benCodCartao?: string;
  codigo_carterinha?: string;
};

@Component({
  selector: 'app-pesquisar-beneficiarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InputComponent, PageHeaderComponent],
  templateUrl: './pesquisar-beneficiarios.html',
  styleUrl: './pesquisar-beneficiarios.css'
})
export class PesquisarBeneficiariosComponent implements OnInit {
    /**
     * Formata o celular para exibir (XX) XXXXXXXX ou (XX) XXXXX-XXXX
     */
    formatarCelular(celular: string | undefined | null): string {
      if (!celular) return '—';
      const digits = celular.replace(/\D/g, '');
      if (digits.length === 11) {
        // Formato (XX) 9XXXX-XXXX
        return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
      } else if (digits.length === 10) {
        // Formato (XX) XXXX-XXXX
        return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
      } else if (digits.length >= 2) {
        // Apenas DDD + resto
        return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
      }
      return celular;
    }
  empresaSelecionada: any = null;
  nome = '';
  matricula = '';
  matriculaTitular = '';

  page = 1;
  pageSize = 10;

  data: BeneficiarioRow[] = [];
  loading = false;
  error: string | null = null;

  

  get filtered(): BeneficiarioRow[] {
    return this.data.filter(r =>
      (!this.nome || r.nome.toLowerCase().includes(this.nome.toLowerCase())) &&
      (!this.matricula || r.matricula_beneficiario.includes(this.matricula)) &&
      (!this.matriculaTitular || r.matricula_titular.includes(this.matriculaTitular))
    );
  }

  get paged(): BeneficiarioRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
  }

  showDetails = false;
  selectedRow: BeneficiarioRow | null = null;
  showExclusao = false;
  exMotivo = '';
  exData = '';
  minDate = '';
  dateError = '';
  showBenefDetails = false;
  benefDetalhes: any = null;

  showCarterinha = false;
  cardNome = '';
  cardCpf = '';
  cardCodigo = '';

  openDetails(row: BeneficiarioRow) {
    this.selectedRow = row;
    this.showDetails = true;
  }
  closeDetails() { this.showDetails = false; this.selectedRow = null; }

  goAlteracaoFromDetails() {
    if (!this.selectedRow) return;
    const r = this.selectedRow;
    const params: any = {
      nome: r.nome,
      cpf: r.cpf,
      nascimento: r.nascimento,
      data_inclusao: this.formatDateBR(r.data_inclusao),
      data_exclusao: this.formatDateBR(r.data_exclusao),
      tipo_dependencia: r.tipo_dependencia,
      matricula_beneficiario: r.matricula_beneficiario,
      matricula_titular: r.matricula_titular
    };

    // Adicionar campos opcionais se existirem
    if (r.nome_mae) params.nome_mae = r.nome_mae;
    if (r.sexo) params.sexo = r.sexo;
    if (r.estado_civil) params.estado_civil = r.estado_civil;
    if (r.admissao) params.admissao = r.admissao;
    if (r.plano_prod) params.plano_prod = r.plano_prod;
    if (r.endereco) params.endereco = r.endereco;
    if (r.numero) params.numero = r.numero;
    if (r.complemento) params.complemento = r.complemento;
    if (r.bairro) params.bairro = r.bairro;
    if (r.cep) params.cep = r.cep;
    if (r.celular) params.celular = r.celular;
    if (r.email) params.email = r.email;
    if (r.telefone) params.telefone = r.telefone;
    if (r.rg) params.rg = r.rg;
    if (r.rg_orgao_expedidor) params.rg_orgao_expedidor = r.rg_orgao_expedidor;
    if (r.rg_uf_expedicao) params.rg_uf_expedicao = r.rg_uf_expedicao;
    if (r.nome_social) params.nome_social = r.nome_social;
    if (r.identidade_genero) params.identidade_genero = r.identidade_genero;
    if (r.indicador_pessoa_trans) params.indicador_pessoa_trans = r.indicador_pessoa_trans;
    if (r.indicadorPessoaTrans) params.indicadorPessoaTrans = r.indicadorPessoaTrans;
    if (r.data_casamento) params.data_casamento = r.data_casamento;
    // Códigos de carteirinha
    if (r.benCodUnimedSeg) params.benCodUnimedSeg = r.benCodUnimedSeg;
    if (r.benCodCartao) params.benCodCartao = r.benCodCartao;

    const query = new URLSearchParams(params).toString();
    this.router.navigateByUrl(`/cadastro-caring/beneficiarios/alteracao-cadastral?${query}`);
    this.closeDetails();
  }

  openExclusao() { this.showExclusao = true; }
  closeExclusao() { this.showExclusao = false; }

  openBenefDetailsExclusao() {
    const r = this.selectedRow;
    if (!r) return;
    this.benefDetalhes = {
      nome: r.nome,
      cpf: r.cpf,
      nascimento: r.nascimento,
      benStatus: this.statusOf(r),
      matricula: r.matricula_beneficiario,
      endereco: (r as any).endereco || '',
      numero: (r as any).numero || '',
      complemento: (r as any).complemento || '',
      bairro: (r as any).bairro || '',
      cep: (r as any).cep || '',
      celular: (r as any).celular,
      email: (r as any).email,
      planoProd: (r as any).plano_prod || '',
      admissao: (r as any).admissao || '',
      benCodUnimedSeg: (r as any).benCodUnimedSeg || '',
      benCodCartao: (r as any).benCodCartao || ''
    };
    this.showBenefDetails = true;
  }

  closeBenefDetails() {
    this.showBenefDetails = false;
    this.benefDetalhes = null;
  }

  formatDateBR(d: Date | null): string {
    if (!d) return '';
    const dd = ('0' + d.getDate()).slice(-2);
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  statusOf(r: BeneficiarioRow): string {
    // Usar benStatus que vem da API (campo obrigatório do banco)
    if (r.benStatus) {
      return r.benStatus;
    }
    
    // Verificar se tem status no campo opcional
    if (r.status) {
      return r.status;
    }
    
    // Se tem data de exclusão mas não tem status, mostrar rescindido
    if (r.data_exclusao) {
      return 'Rescindido';
    }
    
    // Se chegou aqui, há problema nos dados
    return 'Sem Status';
  }

  canOpenExclusao(r: BeneficiarioRow | null): boolean {
    if (!r) return false;
    const status = this.statusOf(r);
    const hasDataExclusao = !!r.data_exclusao;
    
    // Comparação case-insensitive para o status
    const isAtivo = status?.toLowerCase() === 'ativo';
    
    return !hasDataExclusao && isAtivo;
  }

  private parseLocalDate(val: string): Date {
    const [y, m, d] = val.split('-').map(v => parseInt(v, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  }

  private todayLocal(): Date {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }

  private computeMinDate(): string {
    const t = this.todayLocal();
    const y = t.getFullYear();
    const m = ('0' + (t.getMonth() + 1)).slice(-2);
    const d = ('0' + t.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }

  private motivoLabel(code: string): string {
    switch ((code || '').toLowerCase()) {
      case 'rescisao': return 'Rescisão';
      case 'falecimento': return 'Falecimento';
      case 'transferencia': return 'Transferência';
      case 'outro': return 'Outro';
      default: return code || 'Rescindido';
    }
  }

  confirmarExclusao() {
    if (!this.selectedRow) return;

    const today = this.todayLocal();
    if (this.exData) {
      const chosen = this.parseLocalDate(this.exData);
      if (chosen < today) { 
        this.dateError = 'Selecione uma data igual ou posterior a hoje.'; 
        return; 
      }
      this.dateError = '';
    }

    if (!this.selectedRow.cpf) {
      console.error('❌ Beneficiário selecionado não tem CPF válido');
      return;
    }

    const motivo = this.exMotivo || 'RESCISAO';
    const observacoes = `Solicitação de exclusão - Motivo: ${this.motivoLabel(motivo)}`;
    
    // Usar nova API via AprovacaoService
    this.aprovacaoService.criarSolicitacaoExclusao(
      this.selectedRow, 
      motivo, 
      observacoes
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Solicitação de exclusão criada:', response.numeroSolicitacao);
        
        // Marcar beneficiário como Pendente
        this.service.alterarBeneficiario(this.selectedRow!.id, { 
          benStatus: 'Pendente' 
        }).subscribe({
          next: () => {
            console.log('✅ Beneficiário marcado como pendente');
            this.carregarBeneficiarios();
            
            // Mostrar feedback de sucesso
            alert(`Solicitação de exclusão ${response.numeroSolicitacao || 'criada'} com sucesso!\n\nO beneficiário foi marcado como pendente e aguarda aprovação.`);
          },
          error: (error: any) => console.error('❌ Erro ao marcar como pendente:', error)
        });

        // Limpar formulário e fechar modais
        this.exMotivo = '';
        this.exData = '';
        this.showExclusao = false;
        this.closeDetails();
        
        // Navegar para aprovações (opcional)
        // this.router.navigateByUrl('/cadastro-caring/gestao-cadastro/aprovacao-cadastro');
      },
      error: (error: any) => {
        console.error('❌ Erro ao criar solicitação de exclusão:', error);
        
        // Fallback: usar método antigo se nova API falhar
        console.log('🔄 Tentando método de fallback...');
        
        const r = this.selectedRow;
        if (!r) return;
        
        const dataExclusao = this.exData || (() => {
          const t = this.todayLocal();
          const y = t.getFullYear();
          const m = ('0' + (t.getMonth() + 1)).slice(-2);
          const d = ('0' + t.getDate()).slice(-2);
          return `${y}-${m}-${d}`;
        })();

        // Criar solicitação local (método antigo)
        const solicitacao = {
          tipo: 'exclusao' as const,
          entidade: 'Beneficiário',
          identificador: r.cpf,
          descricao: `${r.nome} - Exclusão`,
          solicitante: 'Usuário Atual', // TODO: Pegar do AuthService
          observacao: observacoes
        };

        this.aprovacaoService.add(solicitacao);
        
        alert('Solicitação de exclusão criada com sucesso!\n\nAguardando aprovação.');
        
        this.exMotivo = '';
        this.exData = '';
        this.showExclusao = false;
        this.closeDetails();
      }
    });
  }

  onExDateChange(val: string) {
    this.exData = val;
    if (!val) { this.dateError = ''; return; }
    const today = this.todayLocal();
    const chosen = this.parseLocalDate(val);
    this.dateError = chosen < today ? 'Selecione uma data igual ou posterior a hoje.' : '';
  }

  constructor(
    private router: Router, 
    private service: BeneficiariosService,
    private empresaContextService: EmpresaContextService,
    private aprovacaoService: AprovacaoService
  ) {
    this.minDate = this.computeMinDate();
  }

  ngOnInit(): void {
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();
    
    if (!this.empresaSelecionada?.id) {
      this.error = 'Empresa não selecionada ou sem ID válido. Selecione uma empresa primeiro.';
      return;
    }
    
    // Carregar dados da API
    this.carregarBeneficiarios();
  }

  carregarBeneficiarios(): void {
    this.loading = true;
    this.error = null;
    
    // Usar listRaw para pegar dados brutos da API com campos 'ben'
    this.service.listRaw().subscribe({
      next: (beneficiariosRaw) => {
        console.log('✅ Beneficiários carregados da API:', beneficiariosRaw.length);
        
        // Mapear dados brutos para o formato esperado pelo componente
        this.data = beneficiariosRaw.map(raw => this.mapearDadosBrutos(raw));
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erro ao carregar beneficiários:', error);
        
        // Não exibir mensagens de erro de autenticação - deixar interceptor lidar
        if (error.status === 401 || error.status === 403) {
          console.log('🔐 Erro de autenticação - interceptor vai lidar com isso');
          this.loading = false;
          return;
        }
        
        // Determinar tipo de erro e mensagem apropriada
        if (error.status === 0) {
          this.error = 'Servidor indisponível. Verifique sua conexão com a internet.';
        } else if (error.status === 404) {
          this.error = 'Endpoint não encontrado. Verifique a configuração da API.';
        } else if (error.status >= 500) {
          this.error = 'Erro interno do servidor. Tente novamente mais tarde.';
        } else {
          this.error = 'Erro ao carregar lista de beneficiários. Tente novamente.';
        }
        
        this.data = [];
        this.loading = false;
      }
    });
  }

  pesquisar(): void {
    if (!this.nome && !this.matricula && !this.matriculaTitular) {
      // Se não há filtros, recarregar todos
      this.carregarBeneficiarios();
      return;
    }

    this.loading = true;
    this.error = null;

    const filtros = {
      nome: this.nome || undefined,
      matricula: this.matricula || undefined,
      matriculaTitular: this.matriculaTitular || undefined
    };

    this.service.buscarPorFiltros(filtros).subscribe({
      next: (beneficiarios) => {
        this.data = beneficiarios;
        this.loading = false;
        console.log('✅ Pesquisa realizada:', beneficiarios.length, 'resultados');
      },
      error: (error) => {
        console.error('❌ Erro na pesquisa:', error);
        
        if (error.status === 0) {
          this.error = 'Servidor indisponível para realizar a pesquisa.';
        } else {
          this.error = 'Erro ao realizar pesquisa. Tente novamente.';
        }
        this.loading = false;
      }
    });
  }

  alterar(row: BeneficiarioRow) {
    const params: any = {
      nome: row.nome,
      cpf: row.cpf,
      nascimento: row.nascimento,
      data_inclusao: this.formatDateBR(row.data_inclusao),
      data_exclusao: this.formatDateBR(row.data_exclusao),
      tipo_dependencia: row.tipo_dependencia,
      matricula_beneficiario: row.matricula_beneficiario,
      matricula_titular: row.matricula_titular
    };

    // Adicionar campos opcionais se existirem
    if (row.nome_mae) params.nome_mae = row.nome_mae;
    if (row.sexo) params.sexo = row.sexo;
    if (row.estado_civil) params.estado_civil = row.estado_civil;
    if (row.admissao) params.admissao = row.admissao;
    if (row.plano_prod) params.plano_prod = row.plano_prod;
    if (row.endereco) params.endereco = row.endereco;
    if (row.numero) params.numero = row.numero;
    if (row.complemento) params.complemento = row.complemento;
    if (row.bairro) params.bairro = row.bairro;
    if (row.cep) params.cep = row.cep;
    if (row.celular) params.celular = row.celular;
    if (row.email) params.email = row.email;
    if (row.telefone) params.telefone = row.telefone;
    if (row.rg) params.rg = row.rg;
    if (row.rg_orgao_expedidor) params.rg_orgao_expedidor = row.rg_orgao_expedidor;
    if (row.rg_uf_expedicao) params.rg_uf_expedicao = row.rg_uf_expedicao;
    if (row.nome_social) params.nome_social = row.nome_social;
    if (row.identidade_genero) params.identidade_genero = row.identidade_genero;
    // Códigos de carteirinha
    if (row.benCodUnimedSeg) params.benCodUnimedSeg = row.benCodUnimedSeg;
    if (row.benCodCartao) params.benCodCartao = row.benCodCartao;
    if (row.indicador_pessoa_trans) params.indicador_pessoa_trans = row.indicador_pessoa_trans;
    if (row.data_casamento) params.data_casamento = row.data_casamento;

    const query = new URLSearchParams(params).toString();
    this.router.navigateByUrl(`/cadastro-caring/beneficiarios/alteracao-cadastral?${query}`);
  }

  excluir(row: BeneficiarioRow) {
    if (confirm('Tem certeza que deseja excluir este beneficiário?')) {
      this.loading = true;
      
      this.service.excluirBeneficiario(row.id, 'RESCISAO').subscribe({
        next: () => {
          console.log('✅ Beneficiário excluído com sucesso');
          this.carregarBeneficiarios(); // Recarregar lista
        },
        error: (error) => {
          console.error('❌ Erro ao excluir beneficiário:', error);
          this.error = 'Erro ao excluir beneficiário. Tente novamente.';
          this.loading = false;
        }
      });
    }
  }

  gerarCarterinha() {
    if (!this.selectedRow) return;
    console.log('🔵 gerarCarterinha chamado', this.selectedRow);
    this.cardNome = this.selectedRow.nome || '';
    this.cardCpf = this.selectedRow.cpf || '';
    this.cardCodigo = (this.selectedRow.codigo_carterinha || '').trim() || this.selectedRow.matricula_beneficiario || '';
    // Não fecha o modal de detalhes!
    this.closeExclusao();
    this.showCarterinha = true;
  }

  closeCarterinha() {
    this.showCarterinha = false;
  }


  abrirCartaoVirtual() {
    const r = this.selectedRow;
    const nome = this.cardNome || r?.nome || '';
    const cpf = this.cardCpf || r?.cpf || '';
    const numeroProduto = this.cardCodigo || r?.matricula_beneficiario || '';
    const acomodacao = r?.acomodacao || '';
    const vigencia = r?.data_inclusao ? this.formatDateBR(r.data_inclusao) : '';
    const dataNasc = r?.nascimento || '';
    const query = new URLSearchParams({
      nome,
      cpf,
      numeroProduto,
      acomodacao,
      vigencia,
      dataNasc,
      abrangencia: 'Nacional',
      cpt: 'NÃO HÁ',
      rede: 'NA08 Master',
      segmentacao: 'Ambulatorial + Hospitalar com Obstetrícia',
      atend: '0994',
      via: '01'
    }).toString();
    this.router.navigateByUrl(`/cadastro-caring/beneficiarios/cartao-virtual?${query}`);
    this.closeCarterinha();
  }

  limparFiltros(): void {
    this.nome = '';
    this.matricula = '';
    this.matriculaTitular = '';
    this.carregarBeneficiarios();
  }

  private verificarEmpresaSelecionada(): boolean {
    if (!this.empresaSelecionada) {
      this.error = 'Nenhuma empresa selecionada. Selecione uma empresa antes de continuar.';
      return false;
    }
    if (!this.empresaSelecionada.id) {
      this.error = 'Empresa selecionada não possui ID válido. Selecione novamente a empresa.';
      return false;
    }
    return true;
  }

  private mapearDadosBrutos(raw: any): BeneficiarioRow {
    const codUnimed = raw.benCodUnimedSeg || raw.cod_unimed_seg || '';
    const codCartao = raw.benCodCartao || raw.cod_cartao || '';
    const codigoCarterinha = [codUnimed, codCartao].filter(v => !!v).join('');

    return {
      id: raw.id,
      nome: raw.benNomeSegurado || raw.nome || '',
      cpf: raw.benCpf || raw.cpf || '',
      nascimento: raw.benDtaNasc ? this.formatarDataISO(raw.benDtaNasc) : (raw.nascimento || ''),
      data_inclusao: raw.benDtaInclusao ? (this.parseApiDate(raw.benDtaInclusao) || new Date()) : (raw.data_inclusao ? (this.parseApiDate(raw.data_inclusao) || new Date()) : new Date()),
      data_exclusao: raw.benDtaExclusao ? (this.parseApiDate(raw.benDtaExclusao) || null) : (raw.data_exclusao ? (this.parseApiDate(raw.data_exclusao) || null) : null),
      tipo_dependencia: raw.benRelacaoDep === '00' ? 'titular' : 'dependente',
      acomodacao: this.mapearAcomodacao(raw.benPlanoProd),
      matricula_beneficiario: raw.benMatricula || raw.matricula_beneficiario || '',
      matricula_titular: raw.matricula_titular || '',
      benCodUnimedSeg: codUnimed,
      benCodCartao: codCartao,
      codigo_carterinha: codigoCarterinha,
      
      // Campos detalhados com dados brutos da API
      benStatus: raw.benStatus || 'Ativo',
      admissao: raw.benAdmissao ? this.formatarDataISO(raw.benAdmissao) : '',
      nomeMae: raw.benNomeDaMae || '',
      endereco: raw.benEndereco || '',
      numero: raw.benNumero || '',
      complemento: raw.benComplemento || '',
      bairro: raw.benBairro || '',
      cep: raw.benCep || '',
      celular: raw.benDddCel || '',
      email: raw.benEmail || '',
      
      // Campos complementares
      nome_mae: raw.benNomeDaMae || '',
      sexo: raw.benSexo || '',
      estado_civil: raw.benEstCivil || '',
      plano_prod: raw.benPlanoProd || '',
      telefone: raw.benTelefone || '',
      rg: raw.benRg || '',
      rg_orgao_expedidor: raw.benRgOrgaoExpedidor || '',
      rg_uf_expedicao: raw.benRgUfExpedicao || '',
      nome_social: raw.benNomeSocial || '',
      identidade_genero: raw.benIdentGenero || '',
      indicador_pessoa_trans: raw.benIndicPesTrans || '',
      data_casamento: raw.benDataCasamento ? this.formatarDataISO(raw.benDataCasamento) : ''
    } as BeneficiarioRow;
  }

  private mapearAcomodacao(planoProd: string): string {
    const mapeamento: { [key: string]: string } = {
      'ADMDTXCP': 'Apartamento',
      'QUPLTXCP': 'Quarto',
      'ENFLTXCP': 'Enfermaria'
    };
    return mapeamento[planoProd] || 'Standard';
  }

  private formatarDataISO(data: string): string {
    if (!data) return '';
    const s = data.split('T')[0];
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    const [ano, mes, dia] = s.split('-');
    return (ano && mes && dia) ? `${dia}/${mes}/${ano}` : s;
  }

  private parseApiDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string') {
      const s = value.trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/');
        const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        return isNaN(dt.getTime()) ? null : dt;
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const dt = new Date(s);
        return isNaN(dt.getTime()) ? null : dt;
      }
      const dt = new Date(s);
      return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  }

}
