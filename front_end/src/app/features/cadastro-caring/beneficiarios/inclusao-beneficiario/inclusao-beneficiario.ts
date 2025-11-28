import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputComponent } from '../../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { BeneficiariosService, InclusaoBeneficiarioRequest, Beneficiario } from '../beneficiarios.service';
import { AprovacaoService } from '../../gestao-cadastro/aprovacao.service';
import { EmpresaContextService } from '../../../../shared/services/empresa-context.service';
import { Empresa } from '../../empresa/empresa.service';

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
    pisPasep: '',
    matricula: '',
    lotacaoFuncionario: '',
    declaracaoNascidoVivo: '',
    cns: '',
    dddCelular: '',
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
    identidadeGenero: ''
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
    // Empresariais Básicos
    { value: 'empresarial_basico', label: 'Empresarial Básico' },
    { value: 'empresarial_pratico', label: 'Empresarial Prático' },
    { value: 'empresarial_versatil', label: 'Empresarial Versátil' },
    { value: 'empresarial_dinamico', label: 'Empresarial Dinâmico' },
    { value: 'empresarial_lider', label: 'Empresarial Líder' },
    { value: 'empresarial_senior', label: 'Empresarial Sênior' },
    
    // Básico II, Dinâmico II, etc.
    { value: 'basico_ii', label: 'Básico II' },
    { value: 'dinamico_ii', label: 'Dinâmico II' },
    { value: 'lider_ii', label: 'Líder II' },
    { value: 'pratico_ii', label: 'Prático II' },
    { value: 'senior_ii', label: 'Sênior II' },
    { value: 'versatil_ii', label: 'Versátil II' },
    
    // Corporativos
    { value: 'corp_compacto_enf', label: 'Corporativo Compacto ENF' },
    { value: 'corp_efetivo_apto', label: 'Corporativo Efetivo APTO' },
    { value: 'corp_completo_apto', label: 'Corporativo Completo APTO' },
    { value: 'corp_superior_apto', label: 'Corporativo Superior APTO' },
    { value: 'corp_senior_apto', label: 'Corporativo Sênior APTO' },
    { value: 'corp_compacto_enf_cp', label: 'Corporativo Compacto ENF CP' },
    { value: 'corp_efetivo_apto_cp', label: 'Corporativo Efetivo APTO CP' },
    { value: 'corp_completo_apto_cp_ii', label: 'Corporativo Completo APTO CP II' },
    { value: 'corp_superior_apto_cp', label: 'Corporativo Superior APTO CP' },
    { value: 'corp_senior_apto_cp', label: 'Corporativo Sênior APTO CP' },
    
    // PME
    { value: 'pme_compacto_enf', label: 'PME Compacto ENF' },
    { value: 'pme_efetivo_apto', label: 'PME Efetivo APTO' },
    { value: 'pme_completo_apto', label: 'PME Completo APTO' },
    { value: 'pme_superior_apto', label: 'PME Superior APTO' },
    { value: 'pme_senior_apto', label: 'PME Sênior APTO' },
    { value: 'pme_compacto_enf_cp', label: 'PME Compacto ENF CP' },
    { value: 'pme_efetivo_apto_cp', label: 'PME Efetivo APTO CP' },
    { value: 'pme_completo_apto_cp', label: 'PME Completo APTO CP' },
    { value: 'pme_superior_apto_cp', label: 'PME Superior APTO CP' },
    { value: 'pme_senior_apto_cp', label: 'PME Sênior APTO CP' }
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
    private router: Router
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
    
    this.titulares = this.service.list().filter(b => (b.tipo_dependencia || '').toLowerCase() === 'titular');
    this.titularesFiltrados = [];
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
    
    // Chamada para API real
    this.service.incluirBeneficiario(request).subscribe({
      next: (beneficiario: Beneficiario) => {
        // Adicionar à aprovação
        this.aprovacao.add({
          tipo: 'inclusao',
          entidade: 'beneficiario',
          identificador: this.form.cpf || '',
          descricao: `Inclusão de ${this.form.nomeSegurado || ''}`,
          solicitante: 'Usuário Atual',
          codigoEmpresa: this.empresaSelecionada?.codigoEmpresa || ''
        });
        
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
      benDddCel: this.form.dddCelular || undefined,
      benEmail: this.form.email || undefined,
      benDataCasamento: this.form.dataCasamento ? this.formatarDataParaAPI(this.form.dataCasamento) : undefined,
      benIndicPesTrans: this.form.indicadorPessoaTrans || undefined,
      benNomeSocial: this.form.nomeSocial || undefined,
      benIdentGenero: this.form.identidadeGenero || undefined,
      
      // Data de inclusão (data atual)
      benDtaInclusao: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      
      // ID do titular (se for dependente)
      benTitularId: this.titularEncontrado?.id || undefined
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
      case 'empresarial_basico':
        return 'SSB';
      case 'empresarial_pratico':
        return 'SSP';
      case 'empresarial_versatil':
        return 'SSV';
      case 'empresarial_dinamico':
        return 'SSD';
      case 'empresarial_lider':
        return 'SSL';
      case 'empresarial_senior':
        return 'SSS';
      
      // Afinidade de Adesao
      case 'basico_ii':
        return 'ABII';
      case 'dinamico_ii':
        return 'ADII';
      case 'lider_ii':
        return 'ALII';
      case 'pratico_ii':
        return 'APII';
      case 'senior_ii':
        return 'ASII';
      case 'versatil_ii':
        return 'AVII';
      
      // Corporativos
      case 'corp_compacto_enf':
        return 'CORPCPENF';
      case 'corp_efetivo_apto':
        return 'CORPEFAP';
      case 'corp_completo_apto':
        return 'CORPCPTAP';
      case 'corp_superior_apto':
        return 'CORPSUPAP';
      case 'corp_senior_apto':
        return 'CORPSSSAP';
      case 'corp_compacto_enf_cp':
        return 'CORPCPENFC';
      case 'corp_efetivo_apto_cp':
        return 'CORPEFAPCP';
      case 'corp_completo_apto_cp_ii':
        return 'COAPCPII';
      case 'corp_superior_apto_cp':
        return 'CORPSUPAPC';
      case 'corp_senior_apto_cp':
        return 'CORPSSSAPC';
      
      // PME
      case 'pme_compacto_enf':
        return 'PMECPENF';
      case 'pme_efetivo_apto':
        return 'PMEEFAP';
      case 'pme_completo_apto':
        return 'PMECPAP';
      case 'pme_superior_apto':
        return 'PMESUPAP';
      case 'pme_senior_apto':
        return 'PMESSSAP';
      case 'pme_compacto_enf_cp':
        return 'PMECPENFCP';
      case 'pme_efetivo_apto_cp':
        return 'PMEEFAPCP';
      case 'pme_completo_apto_cp':
        return 'PMECPAPCP';
      case 'pme_superior_apto_cp':
        return 'PMESUPAPCP';
      case 'pme_senior_apto_cp':
        return 'PMESSSAPCP';
      
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
      pisPasep: '',
      matricula: '',
      lotacaoFuncionario: '',
      declaracaoNascidoVivo: '',
      cns: '',
      dddCelular: '',
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
      identidadeGenero: ''
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
