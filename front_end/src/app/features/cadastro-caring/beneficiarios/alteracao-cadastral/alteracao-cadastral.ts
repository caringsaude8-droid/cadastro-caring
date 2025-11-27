import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InputComponent } from '../../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-alteracao-cadastral',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, PageHeaderComponent],
  templateUrl: './alteracao-cadastral.html',
  styleUrl: './alteracao-cadastral.css'
})
export class AlteracaoCadastralComponent {
  form = {
    nomeSegurado: '',
    cpf: '',
    dataNascimento: '',
    dataInclusaoExclusao: '',
    dependencia: '',
    acomodacao: '',
    matricula: '',
    matriculaTitular: '',
    sexo: '',
    estadoCivil: '',
    planoProd: '',
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
    matriculaEmpresa: '',
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
    numeroEmpresa: ''
  };

  sexos = [ { value: 'M', label: 'Masculino' }, { value: 'F', label: 'Feminino' } ];
  estadosCivis = [
    { value: 'solteiro', label: 'Solteiro(a)' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viuvo', label: 'Viúvo(a)' }
  ];
  ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  planos = [ { value: 'planoA', label: 'Plano A' }, { value: 'planoB', label: 'Plano B' } ];

  constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(params => {
      const nome = params.get('nome');
      const cpf = params.get('cpf');
      const nascimento = params.get('nascimento');
      const dataInclusao = params.get('dataInclusao');
      const dataExclusao = params.get('dataExclusao');
      const dependencia = params.get('dependencia');
      const acomodacao = params.get('acomodacao');
      const matricula = params.get('matricula');
      const matriculaTitular = params.get('matriculaTitular');
      if (nome) this.form.nomeSegurado = nome;
      if (cpf) this.form.cpf = cpf;
      if (nascimento) this.form.dataNascimento = nascimento;
      if (dataInclusao || dataExclusao) this.form.dataInclusaoExclusao = dataInclusao || dataExclusao || '';
      if (dependencia) this.form.dependencia = dependencia;
      if (acomodacao) this.form.acomodacao = acomodacao;
      if (matricula) this.form.matricula = matricula;
      if (matriculaTitular) this.form.matriculaTitular = matriculaTitular;
    });
  }

  salvar() {}
}

