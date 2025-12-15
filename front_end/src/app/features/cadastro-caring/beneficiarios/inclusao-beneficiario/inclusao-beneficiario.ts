import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputComponent } from '../../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { BeneficiariosService, InclusaoBeneficiarioRequest, Beneficiario } from '../beneficiarios.service';
import { AprovacaoService } from '../../gestao-cadastro/aprovacao.service';
import { EmpresaContextService } from '../../../../shared/services/empresa-context.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Empresa } from '../../empresa/empresa.service';
import { ViaCepService, ViaCepResponse } from '../../../../shared/services/via-cep.service';

@Component({
  selector: 'app-inclusao-beneficiario',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, PageHeaderComponent],
  templateUrl: './inclusao-beneficiario.html',
  styleUrl: './inclusao-beneficiario.css'
})
export class InclusaoBeneficiarioComponent implements OnInit, OnDestroy {
  form = {
    relacaoDep: '',
    dataNascimento: '',
    sexo: '',
    estadoCivil: '',
    dataInclusaoExclusao: '',
    planoProd: '',
    nomeSegurado: '',
    cpf: '',
    cidade: '',
    uf: '',
    admissao: '',
    nomeMae: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    matricula: '',
    receberComunicacaoEmail: 'nao',
    celular: '',
    email: '',
    motivoExclusao: '',
    cidadeResidencia: '',
    ufResidencia: '',
    codigoEmpresa: '',
    numeroEmpresa: '',
    dataCasamento: '',
    indicadorPessoaTrans: 'nao',
    nomeSocial: '',
    identidadeGenero: '',
    tipoMotivo: 'I', // I=Inclusão, E=Exclusão, A=Alteração, P=Troca de plano
    observacoesSolicitacao: ''
  };

  // Empresa e carregamento
  empresaSelecionada: Empresa | null = null;
  empresaInfo = '';
  loading = false;
  errorMessage = '';
  
  // Toast properties
  showToastMessage = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  // Campos para dependente
  cpfTitular = '';
  titularEncontrado: any = null;
  buscandoTitular = false;

  // Controle do ViaCEP
  cepInvalido = false;
  enderecoCarregado = false;
  isLoadingCep = false;

  anexos: { tipo: string; nome: string; size: number; dataUrl: string }[] = [];
  docTipo = '';
  docTipos = ['RG', 'CPF', 'Comprovante de residência', 'Declaração', 'Contrato', 'Outros'];

  sexos = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Feminino' }
  ];

  estadosCivis = [
    { value: 'solteiro', label: 'Solteiro(a)' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viuvo', label: 'Viúvo(a)' }
  ];

  relacionamentos = [
    { value: 'titular', label: 'Titular' },
    { value: 'esposa', label: 'Esposa' },
    { value: 'companheiro', label: 'Companheiro(a)' },
    { value: 'marido', label: 'Marido' },
    { value: 'filho', label: 'Filho' },
    { value: 'filho_maior', label: 'Filho Maior de Idade' },
    { value: 'filho_adotivo', label: 'Filho Adotivo' },
    { value: 'filha', label: 'Filha' },
    { value: 'filha_maior', label: 'Filha Maior de Idade' },
    { value: 'filha_adotiva', label: 'Filha Adotiva' },
    { value: 'enteado', label: 'Enteado' },
    { value: 'enteada', label: 'Enteada' },
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'sogro', label: 'Sogro' },
    { value: 'sogra', label: 'Sogra' },
    { value: 'irmao', label: 'Irmão' },
    { value: 'irma', label: 'Irmã' },
    { value: 'dependente_legal', label: 'Dependente Legal' },
    { value: 'menor_guarda_tutela', label: 'Menor sob Guarda/Tutela' },
    { value: 'curatelado', label: 'Curatelado' },
    { value: 'outros', label: 'Outros' }
  ];

  ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  planos = [
    // tipo de plano
    { value: 'unimed_adm_dinamico', label: 'UNIMED ADM. DINAMICO' },
    { value: 'unimed_adm_basico', label: 'UNIMED ADMINISTRADO BÁSICO TAXA CP' },
    
    
    
    
    
  ];

  generos = [
    { value: 'feminino', label: 'Feminino' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'nao-binario', label: 'Não-binário' },
    { value: 'outro', label: 'Outro' }
  ];

  isModoCorrecao = false;
  // Modo lote
  modoLote = false;
  grupoLoteId: string | null = null;
  loteMensagem = '';

  ocultarPlanosPorEmpresa: Record<number, string[]> = {
    1: ['unimed_adm_basico'],
    2: ['unimed_adm_dinamico']
  };

  constructor(
    private service: BeneficiariosService, 
    private aprovacao: AprovacaoService,
    private empresaContextService: EmpresaContextService,
    private authService: AuthService,
    private router: Router,
    private viaCepService: ViaCepService
  ) {}

  cepError = '';

  titulares: any[] = [];
  titularesFiltrados: any[] = [];
  titularCpfSearch: string = '';
  selectedTitularCpf: string = '';
  selectedTitular: any = null;
  cpfDuplicado = false;
  dataInclusaoError = '';

  ngOnInit() {
    // Obter empresa selecionada (garantido pelo guard)
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();

    if (this.empresaSelecionada) {
      this.empresaInfo = `Empresa: ${this.empresaSelecionada.nome} (${this.empresaSelecionada.codigoEmpresa})`;
      // Pré-preencher campos da empresa
      this.form.codigoEmpresa = this.empresaSelecionada.codigoEmpresa;
      this.form.numeroEmpresa = this.empresaSelecionada.numeroEmpresa;
    }

    this.ajustarPlanoSelecionado();

    // Verifica se veio dados de correção de solicitação rejeitada
    const nav = window.history.state;
    if (nav && nav.modoCorrecao && nav.dados) {
      this.isModoCorrecao = true;
      try {
        const dados = typeof nav.dados === 'string' ? JSON.parse(nav.dados) : nav.dados;
        const dadosParaPreencher = dados.dadosPropostos || dados;
        // Função para converter dd/MM/yyyy para yyyy-MM-dd
        const brToHtmlDate = (data: string) => {
          if (!data || !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
          const [dia, mes, ano] = data.split('/');
          return `${ano}-${mes}-${dia}`;
        };
        this.form.nomeSegurado = dadosParaPreencher.benNomeSegurado || '';
        this.form.cpf = dadosParaPreencher.benCpf || '';
        this.form.relacaoDep = dadosParaPreencher.relacaoDep || dadosParaPreencher.benRelacaoDepLabel || dadosParaPreencher.benRelacaoDep || '';
        this.form.dataNascimento = brToHtmlDate(dadosParaPreencher.benDtaNasc || '');
        this.form.sexo = dadosParaPreencher.benSexo || '';
        // Ajuste robusto baseado em labels vindos da API
        const normalize = (s: string) => s
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[\.,;:\-_/]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        const matchByLabel = (arr: Array<{value:string; label:string}>, label?: string): string | null => {
          if (!label) return null;
          const norm = normalize(String(label));
          const found = arr.find(x => normalize(x.label) === norm || normalize(x.value) === norm);
          return found ? found.value : null;
        };
        // Conversão reversa para estado civil
        const estadoCivilReverso = (codigo: string) => {
          switch ((codigo || '').toUpperCase()) {
            case 'S': return 'solteiro';
            case 'M': return 'casado';
            case 'D': return 'divorciado';
            case 'W': return 'viuvo';
            default: return '';
          }
        };
        // Conversão reversa para plano prod
        const planoProdReverso = (codigo: string) => {
          switch ((codigo || '').toUpperCase()) {
            case 'ADMDTXCP': return 'unimed_adm_dinamico';
            case 'ADMBTXCP': return 'unimed_adm_basico';
            // Adicione outros casos conforme necessário
            default: return '';
          }
        };
        // Tentar casar por label diretamente; se não, usar reverso por código
        // Estado civil: tentar casar pelo label/valor direto, senão converter código
        const estMatch = matchByLabel(this.estadosCivis, dadosParaPreencher.estadoCivil || dadosParaPreencher.benEstCivil);
        if (estMatch) {
          this.form.estadoCivil = estMatch;
        } else {
          const estApi = String(dadosParaPreencher.benEstCivil || '').toLowerCase();
          if (['solteiro','casado','divorciado','viuvo'].includes(estApi)) {
            this.form.estadoCivil = estApi;
          } else {
            this.form.estadoCivil = estadoCivilReverso(dadosParaPreencher.benEstCivil) || '';
          }
        }

        // Plano/Produto: casar por label/valor direto; fallback para código
        const planoApi = dadosParaPreencher.planoProd || dadosParaPreencher.benPlanoProd;
        const planoMatch = matchByLabel(this.planos as any, planoApi);
        this.form.planoProd = planoMatch || (planoProdReverso(dadosParaPreencher.benPlanoProd || '') || '');

        // Relação de dependência: casar por label/valor direto; fallback para código '00' => titular
        const relApiLabel = dadosParaPreencher.relacaoDep || dadosParaPreencher.benRelacaoDepLabel;
        const relMatch = matchByLabel(this.relacionamentos, relApiLabel);
        if (relMatch) {
          this.form.relacaoDep = relMatch;
        } else {
          const relCode = String(dadosParaPreencher.benRelacaoDep || '').trim();
          if (relCode === '00') this.form.relacaoDep = 'titular';
        }
        try {
        } catch {}
        this.form.cidade = dadosParaPreencher.benCidade || '';
        this.form.uf = dadosParaPreencher.benUf || '';
        this.form.admissao = brToHtmlDate(dadosParaPreencher.benAdmissao || '');
        this.form.nomeMae = dadosParaPreencher.benNomeDaMae || '';
        this.form.endereco = dadosParaPreencher.benEndereco || '';
        this.form.complemento = dadosParaPreencher.benComplemento || '';
        this.form.bairro = dadosParaPreencher.benBairro || '';
        this.form.cep = dadosParaPreencher.benCep || '';
        this.form.matricula = dadosParaPreencher.benMatricula || '';
        this.form.celular = dadosParaPreencher.benDddCel || '';
        this.form.email = dadosParaPreencher.benEmail || '';
        this.form.dataCasamento = brToHtmlDate(dadosParaPreencher.benDataCasamento || '');
        this.form.indicadorPessoaTrans = dadosParaPreencher.benIndicPesTrans || '';
        this.form.nomeSocial = dadosParaPreencher.benNomeSocial || '';
        this.form.identidadeGenero = dadosParaPreencher.benIdentGenero || '';
        this.form.dataInclusaoExclusao = brToHtmlDate(dadosParaPreencher.benDtaInclusao || '');
        this.form.numero = dadosParaPreencher.benNumero || '';
        // Se quiser, pode guardar o id da solicitação para uso posterior
        // this.solicitacaoId = nav.solicitacaoId;
      } catch (e) {
        console.warn('Falha ao preencher dados de correção:', e);
      }
      // chama acultação de planoProd
      this.ajustarPlanoSelecionado();
    }

    // Carregar titulares via Observable
    this.service.list().subscribe({
      next: (beneficiarios) => {
        this.titulares = beneficiarios.filter(b => (b.tipo_dependencia || '').toLowerCase() === 'titular');
        this.titularesFiltrados = [];
      },
      error: (error) => {
        console.error('Erro ao carregar titulares:', error);
        this.titulares = [];
        this.titularesFiltrados = [];
      }
    });
  }

  ngOnDestroy() {
    try {
      localStorage.removeItem('loteAtivo');
    } catch {}
  }

  onRelacaoChanged() {
    // Limpar dados de titular/dependente
    this.cpfTitular = '';
    this.titularEncontrado = null;
    
    if ((this.form.relacaoDep || '').toLowerCase() !== 'dependente') {
      this.titularCpfSearch = '';
      this.selectedTitularCpf = '';
      this.selectedTitular = null;
    }
  }

  filterTitulares() {
    const q = (this.titularCpfSearch || '').replace(/\D/g, '');
    if (q.length !== 11) {
      this.titularesFiltrados = [];
      this.selectedTitularCpf = '';
      this.selectedTitular = null;
      return;
    }
    const match = this.titulares.find(t => t.cpf.replace(/\D/g, '') === q);
    this.titularesFiltrados = match ? [match] : [];
    if (match) {
      this.selectedTitularCpf = match.cpf;
      this.vincularTitular(match.cpf);
    } else {
      this.selectedTitularCpf = '';
      this.selectedTitular = null;
    }
  }

  // consulta CEP removida

  vincularTitular(cpf: string) {
    // Vincula titular selecionado e, para dependente, pré-preenche matrícula do titular
    const titular = this.titulares.find(t => t.cpf === cpf);
    this.selectedTitular = titular || null;
    if (this.selectedTitular) {
      if ((this.form.relacaoDep || '').toLowerCase() !== 'titular') {
        this.form.matricula = this.selectedTitular.matricula_beneficiario || '';
      }
    }
  }

  // integração ViaCEP removida

  async salvar() {
    // Validação básica
    if (!this.form.nomeSegurado || !this.form.cpf || !this.form.dataNascimento || !this.form.relacaoDep) {
      this.showToast('Erro', 'Preencha todos os campos obrigatórios', 'error');
      return;
    }

    if (!this.empresaSelecionada) {
      this.showToast('Erro', 'Empresa não selecionada', 'error');
      return;
    }

    if (!this.isModoCorrecao) {
      const cpfNumerosValid = (this.form.cpf || '').replace(/\D/g, '');
      if (cpfNumerosValid.length === 11) {
        const jaExiste = await this.verificarCpfExistente(cpfNumerosValid);
        if (jaExiste) {
          this.cpfDuplicado = true;
          this.showToast('Erro', 'CPF já cadastrado para esta empresa', 'error');
          return;
        }
      }
    }

    this.validarDatas();
    if (this.dataInclusaoError) {
      this.showToast('Erro', this.dataInclusaoError, 'error');
      return;
    }

    // Validação específica para dependentes
    if (this.form.relacaoDep !== 'titular') {
      const cpfTitularNumeros = (this.cpfTitular || '').replace(/\D/g, '');
      if (!cpfTitularNumeros || cpfTitularNumeros.length < 11) {
        this.showToast('Erro', 'Digite o CPF do titular para dependentes', 'error');
        return;
      }
      if (!this.modoLote) {
        let titular = null;
        try {
          titular = await this.service.buscarTitularPorCpf(cpfTitularNumeros).toPromise();
        } catch (e) {
          this.showToast('Erro', 'Falha ao buscar titular. Faça login novamente.', 'error');
          this.loading = false;
          return;
        }
        if (!titular) {
          this.showToast('Erro', 'Titular não encontrado para o CPF informado', 'error');
          return;
        }
        this.titularEncontrado = titular;
      } else {
        this.titularEncontrado = null;
      }
    }

    // Formatar visualmente CPF e celular no form
    this.form.cpf = this.formatarCpf(this.form.cpf);
    // Mantém celular como dígitos; formatação visual não é necessária

    this.loading = true;
    this.errorMessage = '';

    // Converter formulário para formato da API (respeitando placeholders em modo lote)
    const request = await this.converterFormParaAPI();
    request.benStatus = 'Pendente';

    // Verifica se está em modo de correção de solicitação rejeitada
    const nav = window.history.state;
    if (nav && nav.modoCorrecao && nav.solicitacaoId) {
      // PUT parcial para correção (não altera status)
      try {
        const id = nav.solicitacaoId;
        // Enviar somente o objeto de dadosPropostos (sem wrapper)
        await this.aprovacao.atualizarDadosPropostosDependente(String(id), request).toPromise();
        this.showToast('Sucesso', 'Solicitação corrigida e reenviada com sucesso', 'success');
        this.limparForm();
        this.router.navigate(['/cadastro-caring/beneficiarios/solicitacao-cadastro']);
      } catch (e) {
        this.showToast('Erro', 'Falha ao corrigir solicitação', 'error');
      }
      this.loading = false;
      return;
    }

    // Fluxo normal de inclusão: adiciona marcador [Lote:<UUID>] e [CompletarDependentes] para titulares em modo lote
    const currentUser = this.authService.getCurrentUser();
    const solicitacao = {
      tipo: 'INCLUSAO',
      empresaId: this.empresaSelecionada?.id,
      beneficiarioId: null,
      motivoExclusao: null,
      // Observações com marcador de lote quando aplicável
      observacoesSolicitacao: (() => {
        const base = this.form.observacoesSolicitacao || '';
        if (this.modoLote) {
          const gid = this.grupoLoteId || this.aprovacao.gerarGrupoLoteId();
          this.grupoLoteId = gid;
          const tag = `[Lote:${gid}]`;
          const completar = (this.form.relacaoDep === 'titular') ? ' [CompletarDependentes]' : '';
          return `${base} ${tag}${completar}`.trim();
        }
        return base;
      })(),
      beneficiarioNome: this.form.nomeSegurado || '',
      beneficiarioCpf: (this.form.cpf || '').replace(/\D/g, ''),
      observacoes: '',
      observacoesAprovacao: '',
      dadosPropostos: {
        ...request
      }
    };
    try {
      // Criar solicitação e registrar no lote quando aplicável (titular/dependente) e persistir estado em localStorage
      await new Promise<void>((resolve, reject) => {
        this.aprovacao.criarSolicitacaoInclusao(solicitacao).subscribe({
          next: (resp: any) => {
            try {
              if (this.modoLote && this.grupoLoteId) {
                const gid = this.grupoLoteId;
                const id = resp?.id || resp?.solicitacaoId || null;
                if (id) {
                  // Persistir lote ativo
                  localStorage.setItem('loteAtivo', JSON.stringify({ grupoId: gid, cpfTitular: this.cpfTitular }));
                  this.aprovacao.iniciarLote(gid, this.cpfTitular || solicitacao.beneficiarioCpf);
                  if (this.form.relacaoDep === 'titular') {
                    this.aprovacao.registrarSolicitacaoTitular(gid, id);
                  } else {
                    this.aprovacao.registrarSolicitacaoDependente(gid, id);
                  }
                }
              }
            } catch {}
            resolve();
          },
          error: (e) => reject(e)
        });
      });
      this.showToast('Sucesso', 'Solicitação de inclusão criada com sucesso', 'success');
      this.limparForm();
      this.router.navigate(['/cadastro-caring/beneficiarios/solicitacao-cadastro']);
    } catch (e) {
      const msg = this.getErrorMessage(e);
      this.showToast('Erro', msg, 'error');
    }
    this.loading = false;
  }

  async onCpfInput(value: string) {
    if (this.isModoCorrecao) {
      this.cpfDuplicado = false;
      return;
    }
    const numeros = (value || '').replace(/\D/g, '');
    if (numeros.length === 11) {
      const existe = await this.verificarCpfExistente(numeros);
      this.cpfDuplicado = !!existe;
      if (existe) {
        this.showToast('Erro', 'CPF já cadastrado para esta empresa', 'error');
      }
    } else {
      this.cpfDuplicado = false;
    }
  }

  onCelularInput(value: string) {
    const numeros = (value || '').replace(/\D/g, '').slice(0, 11);
    this.form.celular = this.formatarCelular(numeros);
  }
  
  private getErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'object' && err) {
      const anyErr = err as any;
      if (typeof anyErr.message === 'string' && anyErr.message) return anyErr.message;
      if (typeof anyErr.statusText === 'string' && anyErr.statusText) return anyErr.statusText;
      if (typeof anyErr.error === 'string' && anyErr.error) return anyErr.error;
    }
    if (typeof err === 'string') return err;
    return 'Falha ao criar solicitação';
  }

  private async verificarCpfExistente(cpfNumeros: string): Promise<boolean> {
    try {
      const beneficiariosRaw = await this.service.listRaw().toPromise();
      return !!beneficiariosRaw?.find(b => (b.cpf || b.benCpf) === cpfNumeros);
    } catch (e) {
      return false;
    }
  }

  // Método para converter o formulário para o formato JSON esperado pela API
  private async converterFormParaAPI(): Promise<InclusaoBeneficiarioRequest> {
    // Garante que apenas números vão para o JSON
    const cpfNumeros = (this.form.cpf || '').replace(/\D/g, '');
    const celularNumeros = (this.form.celular || '').replace(/\D/g, '');
    const request: InclusaoBeneficiarioRequest = {
      benEmpId: this.empresaSelecionada?.id || 0,
      benNomeSegurado: this.form.nomeSegurado || '',
      benCpf: cpfNumeros,
      // Quando em modo lote e for dependente, manter rótulo e adiar código numérico (usar string vazia para tipagem)
      benRelacaoDep: (this.modoLote && this.form.relacaoDep !== 'titular') ? '' : await this.mapearRelacaoDependencia(this.form.relacaoDep || ''),
      benRelacaoDepLabel: this.form.relacaoDep || '',
      benDtaNasc: this.form.dataNascimento ? this.formatarDataParaAPI(this.form.dataNascimento) : undefined,
      benSexo: this.form.sexo ? this.converterSexo(this.form.sexo) : undefined,
      benEstCivil: this.form.estadoCivil ? this.converterEstadoCivil(this.form.estadoCivil) : undefined,
      benPlanoProd: this.form.planoProd ? this.converterPlanoProduto(this.form.planoProd) : undefined,
      benCidade: this.form.cidade || undefined,
      benUf: this.form.uf || undefined,
      benAdmissao: this.form.admissao ? this.formatarDataParaAPI(this.form.admissao) : undefined,
      benNomeDaMae: this.form.nomeMae || undefined,
      benEndereco: this.form.endereco || undefined,
      benComplemento: this.form.complemento || undefined,
      benBairro: this.form.bairro || undefined,
      benCep: this.form.cep || undefined,
      // Em modo lote, não preencher matrícula para dependente (será preenchida após aprovação do titular)
      benMatricula: (this.modoLote && this.form.relacaoDep !== 'titular') ? undefined : (this.form.matricula || undefined),
      benDddCel: celularNumeros,
      benEmail: this.form.email || undefined,
      benDataCasamento: this.form.dataCasamento ? this.formatarDataParaAPI(this.form.dataCasamento) : undefined,
      benIndicPesTrans: this.form.indicadorPessoaTrans || undefined,
      benNomeSocial: this.form.nomeSocial || undefined,
      benIdentGenero: this.form.identidadeGenero || undefined,
      benDtaInclusao: this.form.dataInclusaoExclusao ? this.formatarDataParaAPI(this.form.dataInclusaoExclusao) : undefined,
      // Em modo lote para dependente: placeholders com CPF do titular informado; id/matrícula preenchidos após aprovação
      benTitularId: (this.form.relacaoDep !== 'titular') ? ((this.modoLote) ? undefined : this.titularEncontrado?.id) : undefined,
      benTitularCpf: (this.form.relacaoDep !== 'titular') ? ((this.modoLote) ? this.cpfTitular || undefined : (this.titularEncontrado?.cpf || undefined)) : undefined,
      benTitularNome: (this.form.relacaoDep !== 'titular') ? (this.titularEncontrado?.nome || undefined) : undefined,
      benTipoMotivo: 'I',
      benCodUnimedSeg: undefined,
      benDtaExclusao: undefined,
      benCodCartao: undefined,
      benMotivoExclusao: undefined,
      benStatus: 'Pendente',
      benNumero: this.form.numero || undefined
    };
    return request;
  }
  // Formata o CPF para o padrão 000.000.000-00
  private formatarCpf(cpf: string): string {
    const numeros = (cpf || '').replace(/\D/g, '');
    if (numeros.length !== 11) return numeros;
    return `${numeros.substring(0,3)}.${numeros.substring(3,6)}.${numeros.substring(6,9)}-${numeros.substring(9,11)}`;
  }

  // Formata o celular para o padrão (00) 00000-0000 ou (00) 0000-0000
  private formatarCelular(celular: string): string {
    const d = (celular || '').replace(/\D/g, '').slice(0, 11);
    const len = d.length;
    if (len === 0) return '';
    if (len === 1) return `(${d}`;
    if (len === 2) return `(${d})`;
    if (len >= 3 && len <= 6) {
      return `(${d.slice(0,2)})${d.slice(2)}`;
    }
    if (len >= 7 && len <= 10) {
      return `(${d.slice(0,2)})${d.slice(2,6)}-${d.slice(6)}`;
    }
    // 11 dígitos: formato sem espaço para manter 14 caracteres totais
    return `(${d.slice(0,2)})${d.slice(2,7)}-${d.slice(7,11)}`;
  }

  validarDatas() {
    const adm = this.form.admissao;
    const inc = this.form.dataInclusaoExclusao;
    this.dataInclusaoError = '';
    if (adm && inc && /^\d{4}-\d{2}-\d{2}$/.test(adm) && /^\d{4}-\d{2}-\d{2}$/.test(inc)) {
      const [ay, am, ad] = adm.split('-').map(n => parseInt(n, 10));
      const [iy, im, id] = inc.split('-').map(n => parseInt(n, 10));
      const admDate = new Date(ay, am - 1, ad);
      const incDate = new Date(iy, im - 1, id);
      if (incDate < admDate) {
        this.dataInclusaoError = 'Data de inclusão não pode ser anterior à admissão.';
      }
    }
  }
  // Utilitários de conversão
  private formatarDataParaAPI(data: string): string {
    // Se já está no formato dd/MM/yyyy, retorna direto
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      return data;
    }
    // Se está no formato yyyy-MM-dd, converte para dd/MM/yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    // Se está em outro formato, retorna como está
    return data;
  }

  private converterSexo(sexo: string): string {
    // Converter valores do formulário para códigos da API
    switch (sexo.toLowerCase()) {
      case 'feminino':
      case 'female':
      case 'f':
        return 'F';
      case 'masculino':
      case 'male':
      case 'm':
        return 'M';
      default:
        return sexo.toUpperCase(); // Fallback
    }
  }

  private converterEstadoCivil(estadoCivil: string): string {
    // Converter valores do formulário para códigos da API
    switch (estadoCivil.toLowerCase()) {
      case 'solteiro':
      case 'solteira':
      case 'single':
        return 'S';
      case 'casado':
      case 'casada':
      case 'married':
        return 'M';
      case 'divorciado':
      case 'divorciada':
      case 'divorced':
        return 'D';
      case 'viuvo':
      case 'viuva':
      case 'widowed':
        return 'W';
      default:
        return estadoCivil.toUpperCase(); // Fallback
    }
  }

  private converterPlanoProduto(planoProduto: string): string {
    // Converter valores do formulário para códigos da API
    switch (planoProduto.toLowerCase()) {
      // Empresariais Básicos
      case 'unimed_adm_dinamico':
        return 'ADMDTXCP';
      case 'unimed_adm_basico':
        return 'ADMBTXCP';
      // Adicione outros casos conforme necessário
      default:
        return planoProduto ? planoProduto.toUpperCase() : '';
    }
  }

  private async mapearRelacaoDependencia(relacao: string, sexo?: string): Promise<string> {
    const relacaoLower = relacao.toLowerCase();
    
    // Titular sempre é 00
    if (relacaoLower === 'titular') {
      return '00';
    }
    
    // Para dependentes, calcular código baseado no tipo e titular
    if (this.titularEncontrado) {
      return await this.calcularCodigoParentesco(relacaoLower, sexo || this.form.sexo);
    }
    
    // Fallback para códigos básicos
    const mapeamentoBasico: Record<string, string> = {
      'companheira': '02',
      'marido': '09',
      'pai': '50',
      'mae': '51',
      'sogro': '52',
      'sogra': '53'
    };
    return mapeamentoBasico[relacaoLower] ?? '01';
  }

  private async calcularCodigoParentesco(tipoParentesco: string, sexo: string): Promise<string> {
    try {
      // Buscar dependentes existentes do titular
      const dependentes = await this.service.listarDependentes(this.titularEncontrado.id).toPromise();
      
      let codigoBase = 0;
      let codigoMax = 0;
      
      // Definir faixa de códigos baseado no parentesco e sexo
      switch (tipoParentesco) {
        case 'filho':
          if (sexo === 'M') {
            codigoBase = 10; codigoMax = 20; // Filhos: 10-20
          } else {
            codigoBase = 30; codigoMax = 40; // Filhas: 30-40
          }
          break;
        case 'filho_maior':
          if (sexo === 'M') {
            codigoBase = 21; codigoMax = 25; // Filho Maior: 21-25
          } else {
            codigoBase = 41; codigoMax = 45; // Filha Maior: 41-45
          }
          break;
        case 'filha':
          codigoBase = 30; codigoMax = 40; // Filhas: 30-40
          break;
        case 'filha_maior':
          codigoBase = 41; codigoMax = 45; // Filha Maior: 41-45
          break;
        case 'filho_adotivo':
          if (sexo === 'M') {
            codigoBase = 70; codigoMax = 74; // Filho Adotivo: 70-74
          } else {
            codigoBase = 75; codigoMax = 79; // Filha Adotiva: 75-79
          }
          break;
        case 'filha_adotiva':
          codigoBase = 75; codigoMax = 79; // Filha Adotiva: 75-79
          break;
        case 'enteado':
          if (sexo === 'M') {
            codigoBase = 70; codigoMax = 71; // Enteado: 70-71
          } else {
            codigoBase = 72; codigoMax = 74; // Enteada: 72-74
          }
          break;
        case 'enteada':
          codigoBase = 72; codigoMax = 74; // Enteada: 72-74
          break;
        case 'irmao':
          if (sexo === 'M') {
            codigoBase = 80; codigoMax = 84; // Irmão: 80-84
          } else {
            codigoBase = 85; codigoMax = 89; // Irmã: 85-89
          }
          break;
        case 'irma':
          codigoBase = 85; codigoMax = 89; // Irmã: 85-89
          break;
        case 'dependente_legal':
          codigoBase = 60; codigoMax = 69; // Dependente Legal M: 60-69
          break;
        case 'menor_guarda_tutela':
          codigoBase = 5; codigoMax = 8; // Menor sob guarda ou Tutela: 5-8
          break;
        case 'curatelado':
          if (sexo === 'M') {
            codigoBase = 26; codigoMax = 29; // Curatelados: 26-29
          } else {
            codigoBase = 46; codigoMax = 49; // Curateladas: 46-49
          }
          break;
        case 'outros':
          if (sexo === 'M') {
            codigoBase = 90; codigoMax = 94; // Outros M: 90-94
          } else {
            codigoBase = 95; codigoMax = 99; // Outros F: 95-99
          }
          break;
        default:
          // Códigos fixos para tipos específicos
          return this.obterCodigoFixo(tipoParentesco);
      }
      
      // Encontrar códigos já utilizados nesta faixa
      const codigosUsados = (dependentes || [])
        .map((d: any) => parseInt(d.benRelacaoDep || d.tipo_dependencia || '0'))
        .filter((codigo: number) => codigo >= codigoBase && codigo <= codigoMax);
        
      // Encontrar próximo código disponível
      for (let codigo = codigoBase; codigo <= codigoMax; codigo++) {
        if (!codigosUsados.includes(codigo)) {
          return codigo.toString().padStart(2, '0');
        }
      }
      
      // Se todos estão ocupados, retornar erro
      throw new Error(`Limite de dependentes atingido para ${tipoParentesco}`);
      
    } catch (error) {
      console.error('Erro ao calcular código de parentesco:', error);
      return '01'; // Fallback
    }
  }

  showToast(title: string, message: string, type: 'success' | 'error') {
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToastMessage = true;
    
    // Auto-hide após 3 segundos
    setTimeout(() => {
      this.showToastMessage = false;
    }, 3000);
  }

  limparForm() {
    this.form = {
      relacaoDep: '',
      dataNascimento: '',
      sexo: '',
      estadoCivil: '',
      dataInclusaoExclusao: '',
      planoProd: '',
      nomeSegurado: '',
      cpf: '',
      cidade: '',
      uf: '',
      admissao: '',
      nomeMae: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cep: '',
      matricula: '',
      receberComunicacaoEmail: 'nao',
      celular: '',
      email: '',
      motivoExclusao: '',
      cidadeResidencia: '',
      ufResidencia: '',
      codigoEmpresa: this.empresaSelecionada?.codigoEmpresa || '',
      numeroEmpresa: this.empresaSelecionada?.numeroEmpresa || '',
      dataCasamento: '',
      indicadorPessoaTrans: 'nao',
      nomeSocial: '',
      identidadeGenero: '',
      tipoMotivo: 'I', // I=Inclusão, E=Exclusão, A=Alteração, P=Troca de plano
      observacoesSolicitacao: ''
    };
    this.anexos = [];
  }
    // Ocultar planoProd por id
  public isPlanoVisivel(valor: string): boolean {
    const id = this.empresaSelecionada?.id || null;
    if (!id) return true;
    const ocultos = this.ocultarPlanosPorEmpresa[id] || [];
    return !ocultos.includes(valor);
  }

  private ajustarPlanoSelecionado(): void {
    const id = this.empresaSelecionada?.id || null;
    if (!id) return;
    const ocultos = new Set(this.ocultarPlanosPorEmpresa[id] || []);
    if (ocultos.has(this.form.planoProd)) {
      const primeiroVisivel = (this.planos || []).find(p => !ocultos.has(p.value));
      this.form.planoProd = primeiroVisivel?.value || '';
    }
  }

  voltarParaBeneficiarios() {
    this.router.navigate(['/cadastro-caring/beneficiarios']);
  }

  // Alterna modo lote e cria/recupera grupo
  alternarModoLote(ativar: boolean) {
    this.modoLote = ativar;
    if (ativar) {
      if (!this.grupoLoteId) {
        this.grupoLoteId = this.aprovacao.gerarGrupoLoteId();
      }
      localStorage.setItem('loteAtivo', JSON.stringify({ grupoId: this.grupoLoteId, cpfTitular: this.cpfTitular }));
      this.loteMensagem = 'Modo lote ativo';
    } else {
      this.grupoLoteId = null;
      localStorage.removeItem('loteAtivo');
      this.loteMensagem = '';
    }
  }
 


  // Buscar titular por CPF
  async buscarTitular() {
    if (this.modoLote && (this.form.relacaoDep || '').toLowerCase() !== 'titular') {
      const cpfTitularNumeros = (this.cpfTitular || '').replace(/\D/g, '');
      if (!cpfTitularNumeros || cpfTitularNumeros.length < 11) {
        this.showToast('Aviso', 'Digite um CPF válido', 'error');
        return;
      }
      this.titularEncontrado = null;
      this.showToast('Aviso', 'Modo lote: busca de titular não necessária', 'success');
      return;
    }
    const cpfTitularNumeros = (this.cpfTitular || '').replace(/\D/g, '');
    if (!cpfTitularNumeros || cpfTitularNumeros.length < 11) {
      this.showToast('Aviso', 'Digite um CPF válido', 'error');
      return;
    }

    this.buscandoTitular = true;
    
    try {
      const titular = await this.service.buscarTitularPorCpf(cpfTitularNumeros).toPromise();
      
      if (titular && titular.benRelacaoDep === '00') {
        this.titularEncontrado = titular;
        this.showToast('Sucesso', `Titular encontrado: ${titular.nome}`, 'success');
        if ((this.form.relacaoDep || '').toLowerCase() !== 'titular') {
          this.form.matricula = titular.matricula_beneficiario || '';
        }
      } else {
        this.titularEncontrado = null;
        this.showToast('Erro', 'Titular não encontrado ou não é do tipo titular', 'error');
      }
    } catch (error) {
      this.titularEncontrado = null;
      this.showToast('Erro', 'Erro ao buscar titular', 'error');
    } finally {
      this.buscandoTitular = false;
    }
  }

  // Buscar endereço por CEP
  buscarCep(): void {
    const cep = this.form.cep;
    
    if (!cep) {
      this.limparEndereco();
      return;
    }

    // Valida CEP
    if (!this.viaCepService.validarCep(cep)) {
      this.cepInvalido = true;
      this.enderecoCarregado = false;
      return;
    }

    this.cepInvalido = false;
    this.isLoadingCep = true;
    this.enderecoCarregado = false;

    this.viaCepService.buscarCep(cep).subscribe({
      next: (response: ViaCepResponse) => {
        this.isLoadingCep = false;
        
        if (response.erro) {
          this.cepInvalido = true;
          this.enderecoCarregado = false;
          this.limparEndereco();
          this.showToast('Erro', 'CEP não encontrado', 'error');
          return;
        }

        // Preenche os campos automaticamente
        this.form.endereco = response.logradouro;
        this.form.bairro = response.bairro;
        this.form.cidade = response.localidade;
        this.form.uf = response.uf;
        this.form.cep = this.viaCepService.formatarCep(response.cep);
        
        this.enderecoCarregado = true;
        this.cepInvalido = false;
        this.showToast('Sucesso', 'Endereço preenchido automaticamente', 'success');
      },
      error: (error) => {
        this.isLoadingCep = false;
        this.cepInvalido = true;
        this.enderecoCarregado = false;
        this.showToast('Erro', 'Erro ao buscar CEP', 'error');
        console.error('Erro ao buscar CEP:', error);
      }
    });
  }

  limparEndereco(): void {
    this.form.endereco = '';
    this.form.bairro = '';
    this.form.cidade = '';
    this.form.uf = '';
    this.enderecoCarregado = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file || !this.docTipo) {
      alert('Selecione o tipo e o arquivo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      this.anexos.push({ tipo: this.docTipo, nome: file.name, size: file.size, dataUrl });
      input.value = '';
      this.docTipo = '';
    };
    reader.readAsDataURL(file);
  }

  removerAnexo(idx: number) {
    this.anexos.splice(idx, 1);
  }

  baixarAnexo(idx: number) {
    const a = this.anexos[idx];
    if (!a?.dataUrl) return;
    const link = document.createElement('a');
    link.href = a.dataUrl;
    link.download = a.nome;
    link.click();
  }

  private obterCodigoFixo(tipoParentesco: string): string {
    // Códigos fixos (sem faixa)
    const codigosFixos: { [key: string]: string } = {
      'esposa': '01',
      'companheiro': '02',
      'companheira': '02', 
      'marido': '09',
      'pai': '50',
      'mae': '51',
      'sogro': '52',
      'sogra': '53'
    };
    
    return codigosFixos[tipoParentesco] || '01';
  }
}
