import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EmpresaContextService } from '../../../shared/services/empresa-context.service';

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
  celular: string;
  email: string;
  // Campos adicionais para auto-preenchimento
  nome_mae?: string;
  sexo?: string;
  estado_civil?: string;
  admissao?: string;
  plano_prod?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  telefone?: string;
  rg?: string;
  rg_orgao_expedidor?: string;
  rg_uf_expedicao?: string;
  nome_social?: string;
  identidade_genero?: string;
  indicador_pessoa_trans?: string;
  data_casamento?: string;
  benStatus: string; // Status do banco via API
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
  benStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
  private readonly apiUrl = 'http://localhost:8081/api/cadastro/v1';
  private http = inject(HttpClient);
  private empresaContextService = inject(EmpresaContextService);

  private getEmpresaId(): number | null {
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    return empresa?.id || null;
  }

  list(): Observable<Beneficiario[]> {
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    if (!empresa?.id) {
      console.error('❌ Empresa não selecionada ou sem ID para buscar beneficiários');
      return of([]);
    }

    const params = new HttpParams().set('empresaId', empresa.id.toString());
    const url = `${this.apiUrl}/beneficiarios`;
    
    return this.http.get<any[]>(url, { params }).pipe(
      map(beneficiariosApi => beneficiariosApi.map(ben => this.mapearBeneficiarioApi(ben)))
    );
  }

  private mapearBeneficiarioApi(apiData: any): Beneficiario {
    // A API já retorna os dados mapeados, usar campos diretos
    return {
      id: apiData.id,
      nome: apiData.nome || apiData.benNomeSegurado || '',
      cpf: apiData.cpf || apiData.benCpf || '',
      nascimento: apiData.nascimento || (apiData.benDtaNasc ? new Date(apiData.benDtaNasc).toISOString().split('T')[0] : ''),
      data_inclusao: apiData.data_inclusao ? new Date(apiData.data_inclusao) : (apiData.benDtaInclusao ? new Date(apiData.benDtaInclusao) : new Date()),
      data_exclusao: apiData.data_exclusao ? new Date(apiData.data_exclusao) : (apiData.benDtaExclusao ? new Date(apiData.benDtaExclusao) : null),
      tipo_dependencia: apiData.tipo_dependencia || (apiData.benRelacaoDep === '00' ? 'titular' : 'dependente'),
      acomodacao: apiData.acomodacao || this.mapearAcomodacao(apiData.benPlanoProd),
      matricula_beneficiario: apiData.matricula_beneficiario || apiData.benMatricula || '',
      matricula_titular: apiData.matricula_titular || '',
      celular: apiData.celular || apiData.benDddCel || '',
      email: apiData.email || apiData.benEmail || '',
      // Campos adicionais para auto-preenchimento
      nome_mae: apiData.nome_mae || apiData.benNomeDaMae || '',
      sexo: apiData.sexo || apiData.benSexo || '',
      estado_civil: apiData.estado_civil || apiData.benEstCivil || '',
      admissao: apiData.admissao || (apiData.benAdmissao ? new Date(apiData.benAdmissao).toISOString().split('T')[0] : ''),
      plano_prod: apiData.plano_prod || apiData.benPlanoProd || '',
      endereco: apiData.endereco || apiData.benEndereco || '',
      numero: apiData.numero || apiData.benNumero || '',
      complemento: apiData.complemento || apiData.benComplemento || '',
      bairro: apiData.bairro || apiData.benBairro || '',
      cep: apiData.cep || apiData.benCep || '',
      telefone: apiData.telefone || apiData.benTelefone || '',
      rg: apiData.rg || apiData.benRg || '',
      rg_orgao_expedidor: apiData.rg_orgao_expedidor || apiData.benRgOrgaoExpedidor || '',
      rg_uf_expedicao: apiData.rg_uf_expedicao || apiData.benRgUfExpedicao || '',
      nome_social: apiData.nome_social || apiData.benNomeSocial || '',
      identidade_genero: apiData.identidade_genero || apiData.benIdentGenero || '',
      indicador_pessoa_trans: apiData.indicador_pessoa_trans || apiData.benIndicPesTrans || '',
      data_casamento: apiData.data_casamento || (apiData.benDataCasamento ? new Date(apiData.benDataCasamento).toISOString().split('T')[0] : ''),
      benStatus: apiData.benStatus || 'Ativo' // Se não tem status na API, assumir Ativo
    };
  }

  private mapearAcomodacao(planoProd: string): string {
    const mapeamento: { [key: string]: string } = {
      'ADMDTXCP': 'Apartamento',
      'QUPLTXCP': 'Quarto',
      'ENFLTXCP': 'Enfermaria'
    };
    return mapeamento[planoProd] || 'Standard';
  }

  incluirBeneficiario(request: InclusaoBeneficiarioRequest): Observable<Beneficiario> {
    return this.http.post<Beneficiario>(`${this.apiUrl}/beneficiarios`, request);
  }

  alterarBeneficiario(id: number, dados: Partial<Beneficiario>): Observable<Beneficiario> {
    return this.http.put<Beneficiario>(`${this.apiUrl}/beneficiarios/${id}/alteracao`, dados);
  }

  marcarComoExcluido(id: number, motivoExclusao: string): Observable<void> {
    // IMPORTANTE: Apenas altera status, nunca exclui dados do banco
    const dataExclusao = new Date().toISOString();
    return this.http.put<void>(`${this.apiUrl}/beneficiarios/${id}`, {
      benStatus: 'Excluído',
      benMotivoExclusao: motivoExclusao,
      benDtaExclusao: dataExclusao,
      benTipoMotivo: 'E'
    });
  }

  // Método de compatibilidade - usar marcarComoExcluido() preferenciamente
  excluirBeneficiario(id: number, motivoExclusao: string): Observable<void> {
    return this.marcarComoExcluido(id, motivoExclusao);
  }

  listarDependentes(titularId: number): Observable<Beneficiario[]> {
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    if (!empresa?.id) {
      console.error('❌ Empresa não selecionada para listar dependentes');
      return of([]);
    }

    const params = new HttpParams().set('empresaId', empresa.id.toString());
    return this.http.get<Beneficiario[]>(`${this.apiUrl}/beneficiarios/${titularId}/dependentes`, { params });
  }

  // Método para buscar dados brutos da API sem mapeamento (para auto-preenchimento)
  listRaw(): Observable<any[]> {
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    if (!empresa?.id) {
      console.error('❌ Empresa não selecionada para listar beneficiários');
      return of([]);
    }

    const params = new HttpParams().set('empresaId', empresa.id.toString());
    const url = `${this.apiUrl}/beneficiarios`;
    
    // Retorna dados brutos da API sem mapeamento
    return this.http.get<any[]>(url, { params });
  }

  buscarTitularPorCpf(cpf: string): Observable<Beneficiario | null> {
    const empresa = this.empresaContextService.getEmpresaSelecionada();
    if (!empresa?.id) {
      console.error('❌ Empresa não selecionada para buscar titular');
      return of(null);
    }

    const params = new HttpParams()
      .set('empresaId', empresa.id.toString())
      .set('cpf', cpf)
      .set('tipo', 'titular');
    return this.http.get<Beneficiario | null>(`${this.apiUrl}/beneficiarios/buscar`, { params });
  }

  // Métodos auxiliares para busca e filtros
  buscarPorFiltros(filtros: { nome?: string; cpf?: string; matricula?: string }): Observable<Beneficiario[]> {
    // Usar endpoint de listagem normal e filtrar no frontend (mais confiável)
    return this.list().pipe(
      map(beneficiarios => {
        return beneficiarios.filter(b => {
          const matchNome = !filtros.nome || b.nome.toLowerCase().includes(filtros.nome.toLowerCase());
          const matchCpf = !filtros.cpf || b.cpf === filtros.cpf;
          const matchMatricula = !filtros.matricula || b.matricula_beneficiario === filtros.matricula;
          return matchNome && matchCpf && matchMatricula;
        });
      })
    );
  }

  // Métodos de compatibilidade para componentes existentes
  // TODO: Migrar esses componentes para usar a API diretamente
  
  /** @deprecated Use list() com subscribe ao invés disso */
  setStatusByCpf(cpf: string, status: string): void {
    console.warn('⚠️ setStatusByCpf está deprecated. Use a API diretamente.');
    // Método vazio para compatibilidade - a lógica deve ser migrada para API
  }


}
