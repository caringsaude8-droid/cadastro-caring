// Interface para requisição de alteração cadastral
export interface AlteracaoCadastralRequest {
  // Replicar campos relevantes do form conforme uso no PUT
  nomeSegurado?: string;
  cpf?: string;
  dataNascimento?: string;
  // ... outros campos conforme uso ...
  observacoesSolicitacao?: string;
}
import { Injectable } from '@angular/core';
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
  observacoesSolicitacao?: string;
  benRelacaoDep?: string;
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
  benNumero?: string;
  observacoesSolicitacao?: string;
}

@Injectable({ providedIn: 'root' })
export class BeneficiariosService {
  private readonly apiUrl = 'http://localhost:8081/api/cadastro/v1';
  constructor(
    private http: HttpClient,
    private empresaContextService: EmpresaContextService
  ) {}
  /**
   * Atualiza uma solicitação rejeitada (correção) - PUT /api/cadastro/v1/solicitacoes/{id}
   */
  atualizarSolicitacao(id: string | number, payload: any): Observable<any> {
    const url = `${this.apiUrl}/solicitacoes/${id}`;
    return this.http.put(url, payload);
  }

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
      nascimento: apiData.nascimento || (apiData.benDtaNasc ? this.parseApiDateToIso(apiData.benDtaNasc) : ''),
      data_inclusao: apiData.data_inclusao ? (this.parseApiDate(apiData.data_inclusao) || new Date()) : (apiData.benDtaInclusao ? (this.parseApiDate(apiData.benDtaInclusao) || new Date()) : new Date()),
      data_exclusao: apiData.data_exclusao ? (this.parseApiDate(apiData.data_exclusao) || null) : (apiData.benDtaExclusao ? (this.parseApiDate(apiData.benDtaExclusao) || null) : null),
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
      admissao: apiData.admissao || (apiData.benAdmissao ? this.parseApiDateToIso(apiData.benAdmissao) : ''),
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
      data_casamento: apiData.data_casamento || (apiData.benDataCasamento ? this.parseApiDateToIso(apiData.benDataCasamento) : ''),
      benStatus: apiData.benStatus || 'Ativo', // Se não tem status na API, assumir Ativo
      benRelacaoDep: apiData.benRelacaoDep
    };
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

  private parseApiDateToIso(value: any): string {
    if (!value) return '';
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return '';
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      const s = value.trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/');
        const dd = ('0' + parseInt(d, 10)).slice(-2);
        const mm = ('0' + parseInt(m, 10)).slice(-2);
        return `${y}-${mm}-${dd}`;
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.split('T')[0];
      }
    }
    return '';
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

    const params = new HttpParams().set('cpf', cpf).set('empresaId', empresa.id.toString());
    return this.http.get<any>(`${this.apiUrl}/beneficiarios/buscar`, { params }).pipe(
      map(result => {
        if (!result) return null;
        // Se vier array, pega o primeiro item não nulo
        let data = null;
        if (Array.isArray(result)) {
          data = result.find(item => !!item);
        } else {
          data = result;
        }
        if (!data) return null;
        return this.mapearBeneficiarioApi(data);
      })
    );
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
