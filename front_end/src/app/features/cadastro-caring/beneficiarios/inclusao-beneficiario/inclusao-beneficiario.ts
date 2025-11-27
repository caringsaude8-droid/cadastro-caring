import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { BeneficiariosService } from '../beneficiarios.service';
import { AprovacaoService } from '../../gestao-cadastro/aprovacao.service';
// ViaCEP removido

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
    { value: 'dependente', label: 'Dependente' }
  ];

  ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  planos = [
    { value: 'planoA', label: 'Plano A' },
    { value: 'planoB', label: 'Plano B' }
  ];

  generos = [
    { value: 'feminino', label: 'Feminino' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'nao-binario', label: 'Não-binário' },
    { value: 'outro', label: 'Outro' }
  ];

  constructor(private service: BeneficiariosService, private aprovacao: AprovacaoService) {}

  cepError = '';

  titulares: any[] = [];
  titularesFiltrados: any[] = [];
  titularCpfSearch: string = '';
  selectedTitularCpf: string = '';
  selectedTitular: any = null;

  ngOnInit() {
    this.titulares = this.service.list().filter(b => (b.tipo_dependencia || '').toLowerCase() === 'titular');
    this.titularesFiltrados = [];
  }

  onRelacaoChanged() {
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

  salvar() {
    const novo = {
      nome: this.form.nomeSegurado || '',
      cpf: this.form.cpf || '',
      nascimento: this.form.dataNascimento || '',
      tipo_dependencia: (this.form.relacaoDep || '').toUpperCase() === 'TITULAR' ? 'Titular' : (this.form.relacaoDep || ''),
      acomodacao: this.form.planoProd || '',
      matricula_beneficiario: this.form.matricula || '',
      matricula_titular: this.form.numeroEmpresa || ''
    } as any;

    this.service.add(novo);
    const selected = localStorage.getItem('selectedClinic');
    let codigoEmpresa = '';
    try {
      const sc = selected ? JSON.parse(selected) : null;
      codigoEmpresa = sc?.codigo || '';
    } catch {}
    this.aprovacao.add({
      tipo: 'inclusao',
      entidade: 'beneficiario',
      identificador: this.form.cpf || '',
      descricao: `Inclusão de ${this.form.nomeSegurado || ''}`,
      solicitante: 'Usuário Atual',
      codigoEmpresa
    });
    alert('Beneficiário cadastrado (em memória).');
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
}
