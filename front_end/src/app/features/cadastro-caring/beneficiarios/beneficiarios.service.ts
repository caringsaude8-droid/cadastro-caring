import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Beneficiario {
  id: number;
  nome: string;
  cpf: string;
  nascimento: string;
  data_inclusao: Date;
  data_exclusao: Date | null;
  tipo_dependencia: string;
  acomodacao: string;
  matricula_beneficiario: string;
  matricula_titular: string;
  status?: string;
}

// Interface para requisição de inclusão (JSON que a API esperaria)
export interface InclusaoBeneficiarioRequest {
  benEmpId: number;
  benTipoMotivo?: string;
  benCodUnimedSeg?: string;
  benRelacaoDep: string;
  benDtaNasc?: string;
  benSexo?: string;
  benEstCivil?: string;
  benDtaInclusao?: string;
  benDtaExclusao?: string;
  benPlanoProd?: string;
  benNomeSegurado: string;
  benCpf: string;
  benCidade?: string;
  benUf?: string;
  benAdmissao?: string;
  benNomeDaMae?: string;
  benEndereco?: string;
  benComplemento?: string;
  benBairro?: string;
  benCep?: string;
  benMatricula?: string;
  benDddCel?: string;
  benEmail?: string;
  benDataCasamento?: string;
  benIndicPesTrans?: string;
  benNomeSocial?: string;
  benIdentGenero?: string;
  benTitularId?: number;
  benCodCartao?: string;
  benMotivoExclusao?: string;
}

@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
  private beneficiarios: Beneficiario[] = [
    { nome: 'Bruno Cabral de Araujo Pinto', cpf: '08786420640', nascimento: '19/11/1985', data_inclusao: new Date('2025-04-15'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '50005257', matricula_titular: '3198477', id: Date.now() + 1 },
    { nome: 'Bruno Canevassi Leoni', cpf: '31212029879', nascimento: '15/03/1983', data_inclusao: new Date('2025-05-13'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '50004895', matricula_titular: '3198477', id: Date.now() + 2 },
    { nome: 'Bruno Cardoso Ferreira', cpf: '70451184220', nascimento: '02/04/1983', data_inclusao: new Date('2025-04-19'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '3184274', matricula_titular: '3207695', id: Date.now() + 3 },
    { nome: 'Bruno Closs Bruel', cpf: '70741440072', nascimento: '19/03/1985', data_inclusao: new Date('2025-05-13'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '3207695', matricula_titular: '3198477', id: Date.now() + 4 },
    { nome: 'Bruno Fernando Dos Santos Medeiros', cpf: '08646904440', nascimento: '18/06/1999', data_inclusao: new Date('2025-04-25'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Filho(a)', acomodacao: 'APARTAMENTO', matricula_beneficiario: '123', matricula_titular: '50005257', id: Date.now() + 5 },
    { nome: 'Bruno Lopes Quinzeiro', cpf: '03527737752', nascimento: '11/06/1990', data_inclusao: new Date('2025-05-13'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '40520412', matricula_titular: '3198477', id: Date.now() + 6 },
    { nome: 'Bruno Nascimento de Oliveira', cpf: '05387731293', nascimento: '13/01/1990', data_inclusao: new Date('2025-05-13'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '50000630', matricula_titular: '3207695', id: Date.now() + 7 },
    { nome: 'Bruno Nassar Palmeira Oliveira', cpf: '79469744268', nascimento: '24/08/1984', data_inclusao: new Date('2025-05-18'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '27173140', matricula_titular: '50005257', id: Date.now() + 8 },
    { nome: 'Bruno Nassar Palmeira Oliveira Filho', cpf: '10343223329', nascimento: '08/08/2022', data_inclusao: new Date('2025-05-18'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Filho(a)', acomodacao: 'APARTAMENTO', matricula_beneficiario: '50005714', matricula_titular: '27173140', id: Date.now() + 9 },
    { nome: 'Bruno Nicolas de Oliveira Correa', cpf: '52657426208', nascimento: '14/12/1992', data_inclusao: new Date('2025-05-13'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '3175611', matricula_titular: '3207695', id: Date.now() + 10 },
    { nome: 'Ana Beatriz Silva', cpf: '12345678901', nascimento: '05/02/1990', data_inclusao: new Date(), data_exclusao: null, tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '70000101', matricula_titular: '70000101', id: Date.now() + 11 },
    { nome: 'Carlos Eduardo Mendes', cpf: '98765432100', nascimento: '22/09/1986', data_inclusao: new Date('2025-11-20'), data_exclusao: null, tipo_dependencia: 'Dependente', acomodacao: 'APARTAMENTO', matricula_beneficiario: '70000102', matricula_titular: '70000101', id: Date.now() + 12 },
    { nome: 'Mariana Souza Ferreira', cpf: '45612378900', nascimento: '11/07/1995', data_inclusao: new Date('2025-10-02'), data_exclusao: null, tipo_dependencia: 'Filho(a)', acomodacao: 'APARTAMENTO', matricula_beneficiario: '70000103', matricula_titular: '70000101', id: Date.now() + 13 },
    { nome: 'Pedro Henrique Lima', cpf: '78932145600', nascimento: '03/03/1988', data_inclusao: new Date('2025-09-15'), data_exclusao: new Date('2025-11-01'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '70000104', matricula_titular: '70000104', id: Date.now() + 14 },
    { nome: 'João Pedro Almeida', cpf: '32165498700', nascimento: '28/12/1993', data_inclusao: new Date('2025-11-10'), data_exclusao: null, tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '70000105', matricula_titular: '70000105', id: Date.now() + 15 },
    { nome: 'Luiza Ramos Couto', cpf: '65498732100', nascimento: '19/05/1998', data_inclusao: new Date('2025-11-22'), data_exclusao: null, tipo_dependencia: 'Dependente', acomodacao: 'APARTAMENTO', matricula_beneficiario: '70000106', matricula_titular: '70000105', id: Date.now() + 16 }
  ];

  list(): Beneficiario[] { return this.beneficiarios; }

  incluirBeneficiario(request: InclusaoBeneficiarioRequest): Observable<Beneficiario> {
    const isTitular = request.benRelacaoDep === '00' || (request.benRelacaoDep || '').toLowerCase() === 'titular';
    const novo: Beneficiario = {
      id: Date.now(),
      nome: request.benNomeSegurado,
      cpf: request.benCpf,
      nascimento: (request.benDtaNasc || '').split('T')[0] || '',
      data_inclusao: request.benDtaInclusao ? new Date(request.benDtaInclusao) : new Date(),
      data_exclusao: null,
      tipo_dependencia: isTitular ? 'Titular' : 'Dependente',
      acomodacao: 'APARTAMENTO',
      matricula_beneficiario: (request.benMatricula || String(Math.floor(Math.random() * 90000000) + 10000000)),
      matricula_titular: isTitular ? (request.benMatricula || '') : (this.beneficiarios.find(b => b.id === request.benTitularId)?.matricula_beneficiario || ''),
      status: 'Pendente'
    };
    this.beneficiarios = [novo, ...this.beneficiarios];
    return of(novo);
  }

  add(novo: Omit<Beneficiario, 'id' | 'data_inclusao' | 'data_exclusao'> & { data_inclusao?: Date; data_exclusao?: Date | null }): Beneficiario {
    const entity: Beneficiario = {
      ...novo,
      id: Date.now(),
      data_inclusao: novo.data_inclusao ?? new Date(),
      data_exclusao: novo.data_exclusao ?? null,
      status: novo.status ?? 'Pendente'
    } as Beneficiario;
    this.beneficiarios = [entity, ...this.beneficiarios];
    return entity;
  }

  marcarExclusaoPorMatricula(matricula_beneficiario: string, data?: Date, status?: string) {
    const when = data ?? new Date();
    this.beneficiarios = this.beneficiarios.map(b =>
      b.matricula_beneficiario === matricula_beneficiario ? { ...b, data_exclusao: when, status } : b
    );
  }

  listarDependentes(titularId: number): Observable<Beneficiario[]> {
    const titular = this.beneficiarios.find(b => b.id === titularId);
    if (!titular) return of([]);
    const dependentes = this.beneficiarios.filter(b => b.matricula_titular === titular.matricula_beneficiario && (b.tipo_dependencia || '').toLowerCase() !== 'titular');
    return of(dependentes);
  }

  buscarTitularPorCpf(cpf: string): Observable<Beneficiario | null> {
    const clean = (cpf || '').replace(/\D/g, '');
    const titular = this.beneficiarios.find(b => b.cpf.replace(/\D/g, '') === clean && (b.tipo_dependencia || '').toLowerCase() === 'titular');
    return of(titular || null);
  }

  setStatusByCpf(cpf: string, status: string) {
    this.beneficiarios = this.beneficiarios.map(b =>
      b.cpf === cpf ? { ...b, status } : b
    );
  }
}
