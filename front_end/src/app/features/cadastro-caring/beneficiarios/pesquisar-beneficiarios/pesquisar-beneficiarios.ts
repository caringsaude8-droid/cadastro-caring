import { Component } from '@angular/core';
import { BeneficiariosService, Beneficiario } from '../beneficiarios.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InputComponent } from '../../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';

type BeneficiarioRow = Beneficiario & {
  status?: string;
  admissao?: string;
  nomeMae?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  pisPasep?: string;
  lotacaoFuncionario?: string;
  declaracaoNascidoVivo?: string;
  cns?: string;
  dddCelular?: string;
  receberComunicacaoEmail?: string;
  celular?: string;
  email?: string;
  motivoExclusao?: string;
  cidadeResidencia?: string;
  ufResidencia?: string;
  codigoEmpresa?: string;
  numeroEmpresa?: string;
  dataCasamento?: string;
  indicadorPessoaTrans?: string;
  nomeSocial?: string;
  identidadeGenero?: string;
};

@Component({
  selector: 'app-pesquisar-beneficiarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InputComponent, PageHeaderComponent],
  templateUrl: './pesquisar-beneficiarios.html',
  styleUrl: './pesquisar-beneficiarios.css'
})
export class PesquisarBeneficiariosComponent {
  nome = '';
  matricula = '';
  matriculaTitular = '';

  page = 1;
  pageSize = 10;

  data: BeneficiarioRow[] = [];

  constructor(private router: Router, private service: BeneficiariosService) {
    this.data = this.service.list();
  }

  get filtered(): BeneficiarioRow[] {
    return this.data.filter(r =>
      (!this.nome || r.nome.toLowerCase().includes(this.nome.toLowerCase())) &&
      (!this.matricula || r.matricula_beneficiario.includes(this.matricula)) &&
      (!this.matriculaTitular || r.matricula_titular.includes(this.matriculaTitular))
    );
  }

  get paged(): BeneficiarioRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  goTo(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
  }

  showDetails = false;
  selectedRow: BeneficiarioRow | null = null;
  showExclusao = false;
  exMotivo = '';
  exData = '';

  openDetails(row: BeneficiarioRow) {
    this.selectedRow = row;
    this.showDetails = true;
  }
  closeDetails() { this.showDetails = false; this.selectedRow = null; }

  goAlteracaoFromDetails() {
    if (!this.selectedRow) return;
    const r = this.selectedRow;
    const query = new URLSearchParams({
      nome: r.nome,
      cpf: r.cpf,
      nascimento: r.nascimento,
      data_inclusao: this.formatDateBR(r.data_inclusao),
      data_exclusao: this.formatDateBR(r.data_exclusao),
      tipo_dependencia: r.tipo_dependencia,
      acomodacao: r.acomodacao,
      matricula_beneficiario: r.matricula_beneficiario,
      matricula_titular: r.matricula_titular
    }).toString();
    this.router.navigateByUrl(`/cadastro-caring/beneficiarios/alteracao-cadastral?${query}`);
    this.closeDetails();
  }

  openExclusao() { this.showExclusao = true; }
  closeExclusao() { this.showExclusao = false; }

  formatDateBR(d: Date | null): string {
    if (!d) return '';
    const dd = ('0' + d.getDate()).slice(-2);
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  statusOf(r: BeneficiarioRow): string {
    if (r.status) return r.status;
    return r.data_exclusao ? 'Rescindido' : 'Ativo';
  }

  private motivoLabel(code: string): string {
    switch ((code || '').toLowerCase()) {
      case 'rescisao': return 'Rescisão';
      case 'falecimento': return 'Falecimento';
      case 'transferencia': return 'Transferência';
      case 'outro': return 'Outro';
      default: return code || 'Rescindido';
    }
  }

  confirmarExclusao() {
    if (this.selectedRow) {
      const date = this.exData ? new Date(this.exData) : new Date();
      const status = this.motivoLabel(this.exMotivo);
      this.service.marcarExclusaoPorMatricula(this.selectedRow.matricula_beneficiario, date, status);
      this.data = this.service.list();

      const r = this.selectedRow;
      const motivo = status;
      const dataExclusao = this.formatDateBR(date);
      this.exMotivo = '';
      this.exData = '';
      this.showExclusao = false;
      this.closeDetails();
      this.router.navigateByUrl(`/cadastro-caring/beneficiarios/exclusao-cadastral?matricula=${encodeURIComponent(r.matricula_beneficiario)}&nome=${encodeURIComponent(r.nome)}&cpf=${encodeURIComponent(r.cpf)}&motivo=${encodeURIComponent(motivo)}&dataExclusao=${encodeURIComponent(dataExclusao)}`);
      return;
    }
  }

  alterar(row: BeneficiarioRow) {
    const query = new URLSearchParams({
      nome: row.nome,
      cpf: row.cpf,
      nascimento: row.nascimento,
      data_inclusao: this.formatDateBR(row.data_inclusao),
      data_exclusao: this.formatDateBR(row.data_exclusao),
      tipo_dependencia: row.tipo_dependencia,
      acomodacao: row.acomodacao,
      matricula_beneficiario: row.matricula_beneficiario,
      matricula_titular: row.matricula_titular
    }).toString();
    this.router.navigateByUrl(`/cadastro-caring/beneficiarios/alteracao-cadastral?${query}`);
  }

  excluir(row: BeneficiarioRow) {
    this.service.marcarExclusaoPorMatricula(row.matricula_beneficiario);
    this.data = this.service.list();
  }

  gerarCarterinha() {
    alert('Carterinha virtual gerada (simulado).');
  }

  setStatus(row: BeneficiarioRow, status: 'Ativo' | 'Já cadastrado' | 'Documentação pendente') {
    this.service.setStatusByCpf(row.cpf, status);
    this.data = this.service.list();
  }

}
