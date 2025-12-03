import { Component, OnInit } from '@angular/core';
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
export class InclusaoBeneficiarioComponent implements OnInit {
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
    tipoMotivo: 'I' // I=Inclusão, E=Exclusão, A=Alteração, P=Troca de plano
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
    
    
    
    
    
  ];

  generos = [
    { value: 'feminino', label: 'Feminino' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'nao-binario', label: 'Não-binário' },
    { value: 'outro', label: 'Outro' }
  ];

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

  ngOnInit() {
    // Obter empresa selecionada (garantido pelo guard)
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();
    
    if (this.empresaSelecionada) {
      this.empresaInfo = `Empresa: ${this.empresaSelecionada.nome} (${this.empresaSelecionada.codigoEmpresa})`;
      
      // Pré-preencher campos da empresa
      this.form.codigoEmpresa = this.empresaSelecionada.codigoEmpresa;
      this.form.numeroEmpresa = this.empresaSelecionada.numeroEmpresa;
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
    const titular = this.titulares.find(t => t.cpf === cpf);
    this.selectedTitular = titular || null;
    if (this.selectedTitular) {
      this.form.numeroEmpresa = this.selectedTitular.matricula_beneficiario || '';
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

    // Validação específica para dependentes
    if (this.form.relacaoDep !== 'titular' && !this.titularEncontrado) {
      this.showToast('Erro', 'É necessário selecionar um titular válido para dependentes', 'error');
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    // Converter formulário para formato da API
    const request = await this.converterFormParaAPI();
    
    // Garantir que o status 'Pendente' seja definido explicitamente
    request.benStatus = 'Pendente';
    
    console.log('📤 Request enviado para API:', request);
    
    // Chamada para API - salva beneficiário com status 'Pendente'
    this.service.incluirBeneficiario(request).subscribe({
      next: (beneficiario: Beneficiario) => {
        console.log('✅ Beneficiário salvo na API:', beneficiario);
        console.log('📊 Status retornado pela API:', beneficiario.benStatus);
        
        // Verificar se o status foi persistido corretamente
        if (!beneficiario.benStatus || beneficiario.benStatus !== 'Pendente') {
          console.warn('⚠️ Status não foi definido como "Pendente" pela API. Status atual:', beneficiario.benStatus);
        }
        
        // Gerar solicitação para aprovação
        const currentUser = this.authService.getCurrentUser();
        const solicitacao = {
          tipo: 'inclusao' as const,
          entidade: 'beneficiario',
          identificador: beneficiario.cpf || this.form.cpf || '',
          descricao: `${beneficiario.nome || this.form.nomeSegurado || ''}`,
          solicitante: currentUser?.nome || 'Usuário',
          codigoEmpresa: this.empresaSelecionada?.codigoEmpresa || String(this.empresaSelecionada?.id) || ''
        };
        
        console.log('📝 Criando solicitação de aprovação:', solicitacao);
        const solicitacaoCriada = this.aprovacao.add(solicitacao);
        console.log('✅ Solicitação criada com ID:', solicitacaoCriada.id);
        
        this.showToast('Sucesso', 'Beneficiário incluído com sucesso', 'success');
        this.limparForm();
      },
      error: (error: any) => {
        console.error('Erro ao incluir beneficiário:', error);
        this.showToast('Erro', 'Erro ao incluir beneficiário: ' + (error?.error?.message || 'Erro desconhecido'), 'error');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Método para converter o formulário para o formato JSON esperado pela API
  private async converterFormParaAPI(): Promise<InclusaoBeneficiarioRequest> {
    const request: InclusaoBeneficiarioRequest = {
      // Campos obrigatórios
      benEmpId: this.empresaSelecionada?.id || 0,
      benNomeSegurado: this.form.nomeSegurado || '',
      benCpf: this.form.cpf || '',
      benRelacaoDep: await this.mapearRelacaoDependencia(this.form.relacaoDep || ''),
      
      // Campos opcionais com dados do formulário
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
      benMatricula: this.form.matricula || undefined,
      benDddCel: this.form.celular || undefined,
      benEmail: this.form.email || undefined,
      benDataCasamento: this.form.dataCasamento ? this.formatarDataParaAPI(this.form.dataCasamento) : undefined,
      benIndicPesTrans: this.form.indicadorPessoaTrans || undefined,
      benNomeSocial: this.form.nomeSocial || undefined,
      benIdentGenero: this.form.identidadeGenero || undefined,
      
      // Data de inclusão (data atual)
      benDtaInclusao: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      
      // ID do titular (se for dependente)
      benTitularId: this.titularEncontrado?.id || undefined,
      
      // Campos adicionais que a API espera
      benTipoMotivo: 'I', // I=Inclusão (sempre I para inclusão)
      benCodUnimedSeg: undefined, // Código Unimed do segurado (gerado pela API)
      benDtaExclusao: undefined, // Data de exclusão (null para inclusão)
      benCodCartao: undefined, // Código do cartão (gerado pela API)
      benMotivoExclusao: undefined, // Não usado em inclusão
      benStatus: 'Pendente' // Status inicial - aguardando aprovação
    };

    return request;
  }

  // Utilitários de conversão
  private formatarDataParaAPI(data: string): string {
    // Converter de DD/MM/YYYY para YYYY-MM-DD
    if (data.includes('/')) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
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
      
      
  
      default:
        return planoProduto.toUpperCase(); // Fallback
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
    const mapeamentoBasico: { [key: string]: string } = {
      'esposa': '01',
      'companheiro': '02',
      'companheira': '02', 
      'marido': '09',
      'pai': '50',
      'mae': '51',
      'sogro': '52',
      'sogra': '53'
    };
    
    return mapeamentoBasico[relacaoLower] || '01';
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
      tipoMotivo: 'I' // I=Inclusão, E=Exclusão, A=Alteração, P=Troca de plano
    };
    this.anexos = [];
  }

  voltarParaBeneficiarios() {
    this.router.navigate(['/cadastro-caring/beneficiarios']);
  }



  // Buscar titular por CPF
  async buscarTitular() {
    if (!this.cpfTitular || this.cpfTitular.length < 11) {
      this.showToast('Aviso', 'Digite um CPF válido', 'error');
      return;
    }

    this.buscandoTitular = true;
    
    try {
      const titular = await this.service.buscarTitularPorCpf(this.cpfTitular).toPromise();
      
      if (titular) {
        this.titularEncontrado = titular;
        this.showToast('Sucesso', `Titular encontrado: ${titular.nome}`, 'success');
      } else {
        this.titularEncontrado = null;
        this.showToast('Erro', 'Titular não encontrado', 'error');
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
