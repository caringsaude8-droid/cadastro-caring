import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

type Clinica = {
  nome: string;
  cnpj: string;
  codigo: string;
  cidade: string;
  uf: string;
  telefone?: string;
  numeroEmpresa?: string;
};

@Component({
  selector: 'app-empresas-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, PageHeaderComponent],
  templateUrl: './empresa.html',
  styleUrl: './empresa.css'
})
export class EmpresasCadastroComponent {
  search = '';
  selected?: Clinica;
  selectedCodigo: string = '';
  clinicas: Clinica[] = [
    {
      nome: 'Clínica Alpha Saúde',
      cnpj: '12.345.678/0001-90',
      codigo: 'CL001',
      cidade: 'São Paulo',
      uf: 'SP',
      telefone: '(11) 2345-6789',
      numeroEmpresa: '001'
    },
    {
      nome: 'Clínica Beta Vida',
      cnpj: '98.765.432/0001-10',
      codigo: 'CL002',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      telefone: '(21) 9876-5432',
      numeroEmpresa: '002'
    },
    {
      nome: 'Clínica Caring Centro',
      cnpj: '11.222.333/0001-44',
      codigo: 'CL003',
      cidade: 'Belo Horizonte',
      uf: 'MG',
      telefone: '(31) 9988-7766',
      numeroEmpresa: '003'
    }
  ];
  showForm = false;
  novaClinica: Clinica = { nome: '', cnpj: '', codigo: '', cidade: '', uf: '', telefone: '', numeroEmpresa: '' };
  ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  showEdit = false;
  edicaoClinica: Clinica = { nome: '', cnpj: '', codigo: '', cidade: '', uf: '', telefone: '', numeroEmpresa: '' };
  edicaoOriginalCodigo: string = '';

  constructor() {
    const savedClinicas = localStorage.getItem('clinicas');
    if (savedClinicas) {
      try {
        const parsed = JSON.parse(savedClinicas) as Clinica[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.clinicas = parsed;
        }
      } catch {}
    }
    const saved = localStorage.getItem('selectedClinic');
    if (saved) {
      this.selected = JSON.parse(saved);
      this.selectedCodigo = this.selected?.codigo || '';
    }
  }

  get filtered(): Clinica[] {
    const t = this.search.toLowerCase();
    return this.clinicas.filter(c =>
      !t ||
      c.nome.toLowerCase().includes(t) ||
      c.cnpj.includes(t) ||
      c.codigo.toLowerCase().includes(t) ||
      (c.telefone || '').toLowerCase().includes(t) ||
      (c.numeroEmpresa || '').toLowerCase().includes(t)
    );
  }

  selecionar(c: Clinica) {
    this.selected = c;
    localStorage.setItem('selectedClinic', JSON.stringify(c));
  }

  salvarNovaClinica() {
    const c = this.novaClinica;
    if (!c.nome || !c.cnpj || !c.codigo || !c.cidade || !c.uf || !c.telefone || !c.numeroEmpresa) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const duplicate = this.clinicas.some(x => x.codigo.toLowerCase() === c.codigo.toLowerCase() || x.cnpj === c.cnpj);
    if (duplicate) {
      alert('Já existe uma clínica com este Código ou CNPJ');
      return;
    }
    this.clinicas = [...this.clinicas, { ...c }];
    localStorage.setItem('clinicas', JSON.stringify(this.clinicas));
    this.novaClinica = { nome: '', cnpj: '', codigo: '', cidade: '', uf: '', telefone: '', numeroEmpresa: '' };
    this.showForm = false;
    alert('Clínica criada com sucesso');
  }

  cancelarNovaClinica() {
    this.novaClinica = { nome: '', cnpj: '', codigo: '', cidade: '', uf: '', telefone: '', numeroEmpresa: '' };
    this.showForm = false;
    document.body.style.overflow = 'auto';
  }

  abrirNovaEmpresa() {
    this.showForm = true;
    document.body.style.overflow = 'hidden';
  }

  onCnpjInput(value: string) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 14);
    const parts = [
      digits.slice(0, 2),
      digits.slice(2, 5),
      digits.slice(5, 8),
      digits.slice(8, 12),
      digits.slice(12, 14)
    ];
    let formatted = '';
    if (parts[0]) formatted += parts[0];
    if (parts[1]) formatted += '.' + parts[1];
    if (parts[2]) formatted += '.' + parts[2];
    if (parts[3]) formatted += '/' + parts[3];
    if (parts[4]) formatted += '-' + parts[4];
    this.novaClinica.cnpj = formatted;
  }

  acessarSelecionada() {
    if (!this.selectedCodigo) return;
    const found = this.clinicas.find(c => c.codigo === this.selectedCodigo);
    if (found) {
      this.selected = found;
      localStorage.setItem('selectedClinic', JSON.stringify(found));
    }
  }

  abrirEdicaoSelecionada() {
    if (!this.selectedCodigo) return;
    const c = this.clinicas.find(x => x.codigo === this.selectedCodigo);
    if (c) this.abrirEdicaoClinica(c);
  }

  abrirEdicaoClinica(c: Clinica) {
    this.edicaoClinica = { ...c };
    this.edicaoOriginalCodigo = c.codigo;
    this.showEdit = true;
    document.body.style.overflow = 'hidden';
  }

  onCnpjEdicao(value: string) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 14);
    const parts = [digits.slice(0,2), digits.slice(2,5), digits.slice(5,8), digits.slice(8,12), digits.slice(12,14)];
    let f = '';
    if (parts[0]) f += parts[0];
    if (parts[1]) f += '.' + parts[1];
    if (parts[2]) f += '.' + parts[2];
    if (parts[3]) f += '/' + parts[3];
    if (parts[4]) f += '-' + parts[4];
    this.edicaoClinica.cnpj = f;
  }

  salvarEdicaoClinica() {
    const c = this.edicaoClinica;
    if (!c.nome || !c.cnpj || !c.codigo || !c.cidade || !c.uf || !c.telefone || !c.numeroEmpresa) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const duplicate = this.clinicas.some(x => (x.codigo.toLowerCase() === c.codigo.toLowerCase() || x.cnpj === c.cnpj) && x.codigo !== this.edicaoOriginalCodigo);
    if (duplicate) {
      alert('Já existe uma clínica com este Código ou CNPJ');
      return;
    }
    this.clinicas = this.clinicas.map(x => x.codigo === this.edicaoOriginalCodigo ? { ...c } : x);
    localStorage.setItem('clinicas', JSON.stringify(this.clinicas));
    if (this.selected?.codigo === this.edicaoOriginalCodigo) {
      this.selected = { ...c };
      localStorage.setItem('selectedClinic', JSON.stringify(this.selected));
      this.selectedCodigo = this.selected.codigo;
    }
    this.cancelarEdicaoClinica();
    alert('Clínica atualizada com sucesso');
  }

  cancelarEdicaoClinica() {
    this.edicaoClinica = { nome: '', cnpj: '', codigo: '', cidade: '', uf: '', telefone: '', numeroEmpresa: '' };
    this.edicaoOriginalCodigo = '';
    this.showEdit = false;
    document.body.style.overflow = 'auto';
  }
 
  onTelefoneInput(value: string) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);
    const d0 = digits.slice(0, 2);
    const d1 = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
    const d2 = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);
    let f = '';
    if (d0) f += '(' + d0 + ')';
    if (d1) f += ' ' + d1;
    if (d2) f += '-' + d2;
    this.novaClinica.telefone = f;
  }
 
  onTelefoneEdicao(value: string) {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);
    const d0 = digits.slice(0, 2);
    const d1 = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
    const d2 = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);
    let f = '';
    if (d0) f += '(' + d0 + ')';
    if (d1) f += ' ' + d1;
    if (d2) f += '-' + d2;
    this.edicaoClinica.telefone = f;
  }
}
