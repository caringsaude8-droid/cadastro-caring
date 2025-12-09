import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
// Removido MatSnackBar
import { InputComponent } from '../../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { EmpresaContextService } from '../../../../shared/services/empresa-context.service';
import { BeneficiariosService } from '../beneficiarios.service';
import { AprovacaoService } from '../../gestao-cadastro/aprovacao.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-alteracao-cadastral',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, PageHeaderComponent],
  templateUrl: './alteracao-cadastral.html',
  styleUrl: './alteracao-cadastral.css'
})
export class AlteracaoCadastralComponent implements OnInit {
      // Getter/setter para celular formatado visualmente
      get celularFormatado(): string {
        return this.formatarCelular(this.form.celular);
      }
      set celularFormatado(valor: string) {
        // Salva apenas os dígitos no model
        this.form.celular = valor.replace(/\D/g, '').slice(0, 11);
      }
    /**
     * Formata o celular para exibir (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
     */
    formatarCelular(celular: string | undefined | null): string {
      if (!celular) return '';
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



  form = {
    nomeSegurado: '',
    cpf: '',
    dataNascimento: '',
    dataInclusao: '',
    dataExclusao: '',
    dependencia: '',
    matricula: '',
    matriculaTitular: '',
    sexo: '',
    estadoCivil: '',
    planoProd: '',
    cidade: '',
    uf: '',
    admissao: '',
    nomeMae: '',
    rg: '',
    rgOrgaoExpedidor: '',
    rgUfExpedicao: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    pisPasep: '',
    matriculaEmpresa: '',
    lotacaoFuncionario: '',
    declaracaoNascidoVivo: '',
    cns: '',
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
    tipoMotivo: '', // Usuario deve selecionar
    benCodUnimedSeg: '',
    benCodCartao: '',
    benMotivoExclusao: '',
    benTitularId: '',
    observacoesSolicitacao: ''
  };

  // Opções para tipo de motivo na alteração
  tiposMotivo = [
    { value: 'A', label: 'Alteração Cadastral' },
    { value: 'P', label: 'Troca de Plano' }
  ];

  sexos = [ { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' } ];
  estadosCivis = [
    { value: 'solteiro', label: 'Solteiro(a)' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viuvo', label: 'Viúvo(a)' }
  ];
  ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  planos = [
    { value: 'unimed_adm_dinamico', label: 'UNIMED ADM. DINAMICO' }
  ];
  generos = [
    { value: 'cisgenerio', label: 'Cisgênero' },
    { value: 'transgenero', label: 'Transgênero' },
    { value: 'nao_binario', label: 'Não binário' },
    { value: 'outro', label: 'Outro' }
  ];

  // Campos para anexos
  anexos: { tipo: string; nome: string; size: number; dataUrl: string }[] = [];
  docTipo = '';
  docTipos = ['RG', 'CPF', 'Comprovante de residência', 'Declaração', 'Contrato', 'Outros'];

  constructor(
    private route: ActivatedRoute,
    private empresaContextService: EmpresaContextService,
    private router: Router,
    private beneficiariosService: BeneficiariosService,
    private aprovacaoService: AprovacaoService,
    private authService: AuthService,
    // Removido MatSnackBar
  ) {}

  ngOnInit(): void {
    // Obter contexto da empresa
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();
    
    // Auto-preencher formulário com dados da URL e buscar dados completos da API
    this.route.queryParamMap.subscribe(async params => {
      // Dados básicos que estão chegando da listagem
      if (params.get('nome')) this.form.nomeSegurado = params.get('nome')!;
      if (params.get('cpf')) this.form.cpf = params.get('cpf')!;
      if (params.get('nascimento')) this.form.dataNascimento = this.normalizeDateInput(params.get('nascimento')!);
      if (params.get('tipo_dependencia')) this.form.dependencia = params.get('tipo_dependencia')!;
      if (params.get('matricula_beneficiario')) this.form.matricula = params.get('matricula_beneficiario')!;
      if (params.get('matricula_titular')) this.form.matriculaTitular = params.get('matricula_titular')!;
      
      // Campos que podem vir da API expandida
      if (params.get('nome_mae')) this.form.nomeMae = params.get('nome_mae')!;
      if (params.get('sexo')) this.form.sexo = params.get('sexo')!;
      if (params.get('estado_civil')) this.form.estadoCivil = params.get('estado_civil')!;
      if (params.get('admissao')) this.form.admissao = this.normalizeDateInput(params.get('admissao')!);
      if (params.get('plano_prod')) this.form.planoProd = params.get('plano_prod')!;
      
      // Dados complementares
      if (params.get('nome_social')) this.form.nomeSocial = params.get('nome_social')!;
      if (params.get('identidade_genero')) this.form.identidadeGenero = params.get('identidade_genero')!;
      if (params.get('indicador_pessoa_trans')) this.form.indicadorPessoaTrans = params.get('indicador_pessoa_trans') === 'true' ? 'sim' : 'nao';
      if (params.get('data_casamento')) this.form.dataCasamento = params.get('data_casamento')!;
      
      // Documentos
      if (params.get('rg')) this.form.rg = params.get('rg')!;
      if (params.get('rg_orgao_expedidor')) this.form.rgOrgaoExpedidor = params.get('rg_orgao_expedidor')!;
      if (params.get('rg_uf_expedicao')) this.form.rgUfExpedicao = params.get('rg_uf_expedicao')!;
      
      // Endereço
      if (params.get('cep')) this.form.cep = params.get('cep')!;
      if (params.get('endereco')) this.form.endereco = params.get('endereco')!;
      // Suporte tanto para 'numero' quanto 'benNumero' na query string
      if (params.get('numero')) this.form.numero = params.get('numero')!;
      else if (params.get('benNumero')) this.form.numero = params.get('benNumero')!;
      if (params.get('complemento')) this.form.complemento = params.get('complemento')!;
      if (params.get('bairro')) this.form.bairro = params.get('bairro')!;
      if (params.get('cidade')) this.form.cidade = params.get('cidade')!;
      if (params.get('uf')) this.form.uf = params.get('uf')!;
      
      // Contato
      if (params.get('telefone')) this.form.telefone = params.get('telefone')!;
      if (params.get('celular')) this.form.celular = params.get('celular')!;
      if (params.get('email')) this.form.email = params.get('email')!;
      

      
      // Datas
      const dataInclusao = params.get('data_inclusao');
      const dataExclusao = params.get('data_exclusao');
      if (dataInclusao && dataInclusao !== '') {
        this.form.dataInclusao = this.normalizeDateInput(dataInclusao);
      }
      if (dataExclusao && dataExclusao !== '') {
        this.form.dataExclusao = this.normalizeDateInput(dataExclusao);
      }

      // Se temos CPF, tentar buscar dados completos da API
      const cpf = params.get('cpf');
      if (cpf) {
        try {
          // Usar listRaw para obter dados brutos com campos 'ben'
          const beneficiariosRaw = await this.beneficiariosService.listRaw().toPromise();
          const beneficiarioCompleto = beneficiariosRaw?.find(b => (b.cpf || b.benCpf) === cpf);
          
          if (beneficiarioCompleto) {
            console.log('📋 Beneficiário encontrado com dados brutos:', beneficiarioCompleto);
            this.preencherFormularioCompleto(beneficiarioCompleto);
          }
        } catch (error) {
          console.warn('⚠️ Erro ao buscar dados completos:', error);
        }
      }
    });
    
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();
  }



  async salvar() {
    console.log('💾 Salvando alteração com tipoMotivo:', this.form.tipoMotivo);

    // Validação dos campos obrigatórios
    if (!this.form.nomeSegurado?.trim() || !this.form.cpf?.trim() || !this.form.tipoMotivo) {
      alert('Por favor, preencha todos os campos obrigatórios, incluindo o tipo de movimentação.');
      return;
    }

    try {
      const empresa = this.empresaContextService.getEmpresaSelecionada();
      const usuario = this.authService.getCurrentUser();
      if (!empresa || !usuario) {
        alert('Erro: Contexto de empresa ou usuário não encontrado.');
        return;
      }

      // Formatar visualmente CPF e celular no form
      this.form.cpf = this.formatarCpf(this.form.cpf);
      this.form.celular = this.formatarCelular(this.form.celular);

      // Monta dadosPropostos (apenas dados do DTO)
      const dadosPropostos = {
        benTipoMotivo: this.form.tipoMotivo,
        benNomeSegurado: this.form.nomeSegurado,
        benCpf: (this.form.cpf || '').replace(/\D/g, ''),
        benDtaNasc: this.form.dataNascimento,
        benRelacaoDep: this.mapDependencia(this.form.dependencia),
        benSexo: this.form.sexo,
        benEstCivil: this.form.estadoCivil,
        benDddCel: (this.form.celular || '').replace(/\D/g, ''),
        benEmail: this.form.email,
        benEndereco: this.form.endereco,
        benNumero: this.form.numero,
        benComplemento: this.form.complemento,
        benCep: this.form.cep,
        benBairro: this.form.bairro,
        benCidade: this.form.cidade,
        benUf: this.form.uf,
        benNomeDaMae: this.form.nomeMae,
        benNomeSocial: this.form.nomeSocial,
        benIdentGenero: this.form.identidadeGenero,
        benIndicPesTrans: this.form.indicadorPessoaTrans,
        benDataCasamento: this.form.dataCasamento,
        benDtaInclusao: this.form.dataInclusao,
        benDtaExclusao: this.form.dataExclusao,
        benPlanoProd: this.form.planoProd,
        benAdmissao: this.form.admissao,
        benMatricula: this.form.matricula,
        benCodUnimedSeg: null,
        benTitularId: null,
        benCodCartao: null,
        benMotivoExclusao: null,
        benEmpId: empresa.id,
        benStatus: 'ATIVO'
      };

      // Busca beneficiário por CPF para obter ID
      const beneficiariosRaw = await this.beneficiariosService.listRaw().toPromise();
      const beneficiario = beneficiariosRaw?.find(b => (b.cpf || b.benCpf) === this.form.cpf);
      if (!beneficiario) {
        alert('Beneficiário não encontrado. Verifique o CPF.');
        return;
      }

      // Monta objeto principal da solicitação
      const solicitacao = {
        beneficiarioId: beneficiario.id,
        beneficiarioNome: beneficiario.nome || beneficiario.benNomeSegurado || '',
        beneficiarioCpf: beneficiario.cpf || beneficiario.benCpf || '',
        tipo: 'ALTERACAO',
        dadosPropostos,
        observacoesSolicitacao: this.form.observacoesSolicitacao || '',
        observacoes: '',
        observacoesAprovacao: '',
        empresaId: empresa.id
      };

      console.log('🚀 Disparando solicitação de alteração cadastral:', solicitacao);

      this.aprovacaoService.criarSolicitacaoAlteracao(
        beneficiario,
        dadosPropostos,
        solicitacao.observacoesSolicitacao,
        empresa.id
      ).subscribe({
        next: (response: any) => {
          console.log('✅ Solicitação criada (resposta do POST /solicitacoes):', response);
          console.log('🔎 JSON da solicitação de alteração:', JSON.stringify(solicitacao, null, 2));
          alert('✔ Solicitação de alteração criada com sucesso!');
          setTimeout(() => {
            this.router.navigate(['/cadastro-caring/beneficiarios/pesquisar-beneficiarios']);
          }, 1000);
        },
        error: (error: any) => {
          console.error('❌ Erro na chamada POST /solicitacoes:', error);
        }
      });
    } catch (error) {
      alert('Erro ao salvar alteração. Tente novamente.');
    }
  }

  // Formata o CPF para o padrão 000.000.000-00
  private formatarCpf(cpf: string): string {
    const numeros = (cpf || '').replace(/\D/g, '');
    if (numeros.length !== 11) return numeros;
    return `${numeros.substring(0,3)}.${numeros.substring(3,6)}.${numeros.substring(6,9)}-${numeros.substring(9,11)}`;
  }

  private getTipoMotivoTexto(codigo: string): string {
    switch (codigo) {
      case 'A': return 'Alteração Cadastral';
      case 'P': return 'Troca de Plano';
      default: return 'Não especificado';
    }
  }

  cancelar() {
    console.log('🚫 Cancelando alteração cadastral');
    this.router.navigate(['/cadastro-caring/beneficiarios']);
  }

  private preencherFormularioCompleto(beneficiario: any) {
    // Preenchimento direto apenas com os campos padronizados da API
    if (beneficiario.benNumero) this.form.numero = beneficiario.benNumero;
    if (beneficiario.benDataInclusao) this.form.dataInclusao = this.formatarDataBR(beneficiario.benDataInclusao);
    if (beneficiario.benDtaExclusao) this.form.dataExclusao = this.formatarDataBR(beneficiario.benDtaExclusao);
    if (beneficiario.benNomeDaMae) this.form.nomeMae = beneficiario.benNomeDaMae;
    if (beneficiario.benSexo) this.form.sexo = beneficiario.benSexo === 'M' ? 'M' : 'F';
    if (beneficiario.benEstCivil) this.form.estadoCivil = this.mapearEstadoCivil(beneficiario.benEstCivil);
    if (beneficiario.benAdmissao) this.form.admissao = this.formatarDataBR(beneficiario.benAdmissao);
    if (beneficiario.benPlanoProd) this.form.planoProd = this.mapearPlanoProduto(beneficiario.benPlanoProd);
    if (beneficiario.benEndereco) this.form.endereco = beneficiario.benEndereco;
    if (beneficiario.benComplemento) this.form.complemento = beneficiario.benComplemento;
    if (beneficiario.benBairro) this.form.bairro = beneficiario.benBairro;
    if (beneficiario.benCidade) this.form.cidade = beneficiario.benCidade;
    if (beneficiario.benUf) this.form.uf = beneficiario.benUf;
    if (beneficiario.benCep) this.form.cep = beneficiario.benCep;
    if (beneficiario.benDddCel) this.form.celular = beneficiario.benDddCel;
    if (beneficiario.benEmail) this.form.email = beneficiario.benEmail;
    if (beneficiario.benIndicPesTrans) this.form.indicadorPessoaTrans = beneficiario.benIndicPesTrans;
    if (beneficiario.benDataCasamento) {
      this.form.dataCasamento = this.formatarDataBR(beneficiario.benDataCasamento);
    }
    if (beneficiario.benNomeSocial) this.form.nomeSocial = beneficiario.benNomeSocial;
    if (beneficiario.benIdentGenero) this.form.identidadeGenero = beneficiario.benIdentGenero;
    console.log('✅ Auto-preenchimento concluído');
  }

  private mapearEstadoCivil(codigo: string): string {
    const mapeamento: { [key: string]: string } = {
      'S': 'solteiro',
      'M': 'casado', 
      'D': 'divorciado',
      'W': 'viuvo'
    };
    return mapeamento[codigo] || codigo.toLowerCase();
  }

  private mapearPlanoProduto(codigo: string): string {
    const mapeamento: { [key: string]: string } = {
      'ADMDTXCP': 'unimed_adm_dinamico'
    };
    return mapeamento[codigo] || codigo;
  }

  private formatarDataBR(data: string): string {
    if (!data) return '';
    const soData = data.split('T')[0];
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(soData)) return soData;
    const [ano, mes, dia] = soData.split('-');
    return (ano && mes && dia) ? `${dia}/${mes}/${ano}` : soData;
  }

  private mapDependencia(val: string): string {
    if (!val) return '';
    const v = val.toLowerCase();
    if (v === 'titular' || v === '00') return '00';
    if (v === 'dependente' || v === '01') return '01';
    return val;
  }

  onNascimentoChange(val: string) { this.form.dataNascimento = this.normalizeDateInput(val); }
  onDataInclusaoChange(val: string) { this.form.dataInclusao = this.normalizeDateInput(val); }
  onDataExclusaoChange(val: string) { this.form.dataExclusao = this.normalizeDateInput(val); }
  onAdmissaoChange(val: string) { this.form.admissao = this.normalizeDateInput(val); }

  isDateValid(val: string | null | undefined): boolean {
    if (!val) return true;
    const s = val.trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
    const [dd, mm, yyyy] = s.split('/').map(v => parseInt(v, 10));
    if (mm < 1 || mm > 12) return false;
    if (dd < 1 || dd > 31) return false;
    const d = new Date(yyyy, mm - 1, dd);
    return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
  }

  private normalizeDateInput(val: string): string {
    if (!val) return '';
    const digits = val.replace(/\D/g, '').slice(0, 8);
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    if (digits.length <= 2) return d;
    if (digits.length <= 4) return `${d}/${m}`;
    return `${d}/${m}/${y}`;
  }

  // Métodos para anexos
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
}

