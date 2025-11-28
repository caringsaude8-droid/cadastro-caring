import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  codigoEmpresa?: string;
  numeroEmpresa?: string;
  status?: string;
}

// Interface para requisição de inclusão (JSON que a API espera)
export interface InclusaoBeneficiarioRequest {
  benEmpId: number;                // ID da empresa (Long, obrigatório)
  benTipoMotivo?: string;          // Motivo do cadastro (string, opcional)
  benCodUnimedSeg?: string;        // Código Unimed/Seguradora (string, opcional)
  benRelacaoDep: string;           // Relação de dependência ("0" titular, "1" dependente, string, obrigatório)
  benDtaNasc?: string;             // Data de nascimento (formato ISO, opcional)
  benSexo?: string;                // Sexo (string, opcional)
  benEstCivil?: string;            // Estado civil (string, opcional)
  benDtaInclusao?: string;         // Data de inclusão (formato ISO, opcional)
  benDtaExclusao?: string;         // Data de exclusão (formato ISO, opcional)
  benPlanoProd?: string;           // Plano/produto (string, opcional)
  benNomeSegurado: string;         // Nome do segurado (string, obrigatório)
  benCpf: string;                  // CPF (string, obrigatório)
  benCidade?: string;              // Cidade (string, opcional)
  benUf?: string;                  // UF (string, opcional)
  benAdmissao?: string;            // Data de admissão (formato ISO, opcional)
  benNomeDaMae?: string;           // Nome da mãe (string, opcional)
  benEndereco?: string;            // Endereço (string, opcional)
  benComplemento?: string;         // Complemento (string, opcional)
  benBairro?: string;              // Bairro (string, opcional)
  benCep?: string;                 // CEP (string, opcional)
  benMatricula?: string;           // Matrícula (string, opcional)
  benDddCel?: string;              // DDD do celular (string, opcional)
  benEmail?: string;               // Email (string, opcional)
  benDataCasamento?: string;       // Data de casamento (formato ISO, opcional)
  benIndicPesTrans?: string;       // Indicador de pessoa trans (string, opcional)
  benNomeSocial?: string;          // Nome social (string, opcional)
  benIdentGenero?: string;         // Identidade de gênero (string, opcional)
  benTitularId?: number;           // ID do titular (Long, obrigatório se for dependente)
  benCodCartao?: string;           // Código do cartão (string, opcional)
  benMotivoExclusao?: string;      // Motivo de exclusão (string, opcional)
}

@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
  private readonly apiUrl = 'http://localhost:8081/api/cadastro/v1/beneficiarios';
  private beneficiarios: Beneficiario[] = [
    { nome: 'Bruno Cabral de Araujo Pinto', cpf: '08786420640', nascimento: '19/11/1985', data_inclusao: new Date('2025-04-15'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '50005257', matricula_titular: '3198477', codigoEmpresa: '73990705', numeroEmpresa: '50994052411', id: Date.now() + 1 },
    { nome: 'Bruno Canevassi Leoni', cpf: '31212029879', nascimento: '15/03/1983', data_inclusao: new Date('2025-05-13'), data_exclusao: new Date('2025-06-06'), tipo_dependencia: 'Titular', acomodacao: 'APARTAMENTO', matricula_beneficiario: '50004895', matricula_titular: '3198477', codigoEmpresa: '73990705', numeroEmpresa: '50994052411', id: Date.now() + 2 },
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

  constructor(private http: HttpClient) {}

  // Método para listar beneficiários (simulado)
  list(): Beneficiario[] { 
    return this.beneficiarios; 
  }

  // Método para incluir beneficiário via API
  incluirBeneficiario(request: InclusaoBeneficiarioRequest): Observable<Beneficiario> {
    return this.http.post<Beneficiario>(this.apiUrl, request);
  }

  // Método local para testes (manter temporariamente)
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

  // Buscar beneficiários por empresa
  listarPorEmpresa(codigoEmpresa: string): Observable<Beneficiario[]> {
    return this.http.get<Beneficiario[]>(`${this.apiUrl}?codigoEmpresa=${codigoEmpresa}`);
  }

  // Buscar titular por CPF
  buscarTitularPorCpf(cpf: string): Observable<Beneficiario> {
    return this.http.get<Beneficiario>(`${this.apiUrl}/buscar-cpf/${cpf}`);
  }

  // Listar dependentes de um titular
  listarDependentes(titularId: number): Observable<Beneficiario[]> {
    return this.http.get<Beneficiario[]>(`${this.apiUrl}/dependentes/${titularId}`);
  }

  // Alterar beneficiário
  alterarBeneficiario(id: number, request: Partial<InclusaoBeneficiarioRequest>): Observable<Beneficiario> {
    return this.http.put<Beneficiario>(`${this.apiUrl}/${id}/alteracao`, request);
  }

  // Excluir beneficiário
  excluirBeneficiario(id: number, motivoExclusao: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/exclusao`, {
      body: { motivoExclusao }
    });
  }

  marcarExclusaoPorMatricula(matricula_beneficiario: string, data?: Date, status?: string) {
    const when = data ?? new Date();
    this.beneficiarios = this.beneficiarios.map(b =>
      b.matricula_beneficiario === matricula_beneficiario ? { ...b, data_exclusao: when, status } : b
    );
  }

  setStatusByCpf(cpf: string, status: string) {
    this.beneficiarios = this.beneficiarios.map(b =>
      b.cpf === cpf ? { ...b, status } : b
    );
  }
}
