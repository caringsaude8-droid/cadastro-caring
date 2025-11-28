import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InputComponent } from '../../../shared/components/ui/input/input';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { EmpresaService, Empresa } from './empresa.service';
import { EmpresaContextService } from '../../../shared/services/empresa-context.service';

@Component({
  selector: 'app-empresas-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, PageHeaderComponent],
  templateUrl: './empresa.html',
  styleUrl: './empresa.css'
})
export class EmpresasCadastroComponent implements OnInit {
  search = '';
  selected?: Empresa;
  selectedId: number | null = null;
  empresas: Empresa[] = [];
  showForm = false;
  novaEmpresa: Omit<Empresa, 'id'> = {
    nome: '',
    cnpj: '',
    codigoEmpresa: '',
    cidade: '',
    uf: '',
    email: '',
    telefone: '',
    numeroEmpresa: ''
  };
  ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  showEdit = false;
  showDetails = false;
  empresaDetalhes: Empresa | null = null;
  edicaoEmpresa: Omit<Empresa, 'id'> = {
    nome: '',
    cnpj: '',
    codigoEmpresa: '',
    cidade: '',
    uf: '',
    email: '',
    telefone: '',
    numeroEmpresa: ''
  };
  edicaoEmpresaId: number | null = null;
  loading = false;
  errorMessage = '';
  
  // Toast properties
  showToastMessage = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  
  // Aviso do guard
  showWarningMessage = false;
  warningMessage = '';
  returnUrl = '';

  constructor(
    private empresaService: EmpresaService,
    private empresaContextService: EmpresaContextService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.carregarEmpresas();
    
    // Verificar se há empresa já selecionada no contexto
    const empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();
    if (empresaSelecionada) {
      this.selected = empresaSelecionada;
      this.selectedId = empresaSelecionada.id || null;
    }
    
    // Verificar se há mensagem de aviso do guard
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.warningMessage = params['message'];
        this.returnUrl = params['returnUrl'] || '';
        this.showWarningMessage = true;
      }
    });
  }

  carregarEmpresas(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.empresaService.listarEmpresas().subscribe({
      next: (empresas) => {
        this.empresas = empresas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar empresas:', error);
        this.errorMessage = 'Erro ao carregar empresas';
        this.loading = false;
      }
    });
  }

  get filtered(): Empresa[] {
    const t = this.search.toLowerCase();
    return this.empresas.filter(e =>
      !t ||
      e.nome.toLowerCase().includes(t) ||
      e.cnpj.includes(t) ||
      e.codigoEmpresa.toLowerCase().includes(t) ||
      e.email.toLowerCase().includes(t) ||
      e.telefone.toLowerCase().includes(t) ||
      e.numeroEmpresa.toLowerCase().includes(t)
    );
  }

  selecionar(empresa: Empresa) {
    this.selected = empresa;
    this.selectedId = empresa.id || null;
  }

  salvarNovaEmpresa() {
    const e = this.novaEmpresa;
    if (!e.nome || !e.cnpj || !e.codigoEmpresa || !e.cidade || !e.uf || !e.email || !e.telefone || !e.numeroEmpresa) {
      this.errorMessage = 'Preencha todos os campos obrigatórios';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    this.empresaService.criarEmpresa(e).subscribe({
      next: (empresa) => {
        this.empresas = [...this.empresas, empresa];
        this.resetarNovaEmpresa();
        this.showForm = false;
        this.loading = false;
        this.showToast('Sucesso', 'Empresa criada com sucesso', 'success');
      },
      error: (error) => {
        console.error('Erro ao criar empresa:', error);
        this.errorMessage = 'Erro ao criar empresa';
        this.loading = false;
      }
    });
  }

  abrirNovaEmpresa() {
    this.showForm = true;
    this.errorMessage = '';
    document.body.style.overflow = 'hidden';
  }

  cancelarNovaEmpresa() {
    this.resetarNovaEmpresa();
    this.showForm = false;
    this.errorMessage = '';
    document.body.style.overflow = 'auto';
  }
  
  resetarNovaEmpresa() {
    this.novaEmpresa = {
      nome: '',
      cnpj: '',
      codigoEmpresa: '',
      cidade: '',
      uf: '',
      email: '',
      telefone: '',
      numeroEmpresa: ''
    };
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
    this.novaEmpresa.cnpj = formatted;
  }

  acessarSelecionada() {
    if (!this.selectedId) return;
    
    const found = this.empresas.find(e => e.id === this.selectedId);
    
    if (found) {
      this.selected = found;
      
      // Salvar empresa selecionada no contexto global
      this.empresaContextService.setEmpresaSelecionada(found);
      
      // Limpar mensagem de aviso
      this.showWarningMessage = false;
      
      // Redirecionar para a URL original ou para pesquisar beneficiários
      const redirectUrl = this.returnUrl || '/cadastro-caring/beneficiarios';
      this.router.navigate([redirectUrl]);
      
      // Manter a empresa selecionada no campo (não limpar selectedId)
      // this.selectedId permanece com o valor para mostrar qual empresa está ativa
    }
  }
  
  onEmpresaSelectionChange(value: any) {
    // Converter para number se for string
    this.selectedId = value === 'null' || value === null ? null : Number(value);
  }

  fecharAviso() {
    this.showWarningMessage = false;
    this.warningMessage = '';
    this.returnUrl = '';
  }

  abrirEdicaoSelecionada() {
    if (!this.selectedId) return;
    const empresa = this.empresas.find(e => e.id === this.selectedId);
    if (empresa) this.abrirEdicaoEmpresa(empresa);
  }

  abrirEdicaoEmpresa(empresa: Empresa) {
    const { id, ...empresaSemId } = empresa;
    this.edicaoEmpresa = { ...empresaSemId };
    this.edicaoEmpresaId = id || null;
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
    this.edicaoEmpresa.cnpj = f;
  }

  salvarEdicaoEmpresa() {
    const e = this.edicaoEmpresa;
    if (!e.nome || !e.cnpj || !e.codigoEmpresa || !e.cidade || !e.uf || !e.email || !e.telefone || !e.numeroEmpresa) {
      this.errorMessage = 'Preencha todos os campos obrigatórios';
      return;
    }
    
    if (!this.edicaoEmpresaId) {
      this.errorMessage = 'ID da empresa não encontrado';
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    this.empresaService.atualizarEmpresa(this.edicaoEmpresaId, e).subscribe({
      next: (empresaAtualizada) => {
        this.empresas = this.empresas.map(emp => 
          emp.id === this.edicaoEmpresaId ? empresaAtualizada : emp
        );
        
        if (this.selected?.id === this.edicaoEmpresaId) {
          this.selected = empresaAtualizada;
        }
        
        this.cancelarEdicaoEmpresa();
        this.loading = false;
        this.showToast('Sucesso', 'Empresa atualizada com sucesso', 'success');
      },
      error: (error) => {
        console.error('Erro ao atualizar empresa:', error);
        this.errorMessage = 'Erro ao atualizar empresa';
        this.loading = false;
      }
    });
  }

  cancelarEdicaoEmpresa() {
    this.edicaoEmpresa = {
      nome: '',
      cnpj: '',
      codigoEmpresa: '',
      cidade: '',
      uf: '',
      email: '',
      telefone: '',
      numeroEmpresa: ''
    };
    this.edicaoEmpresaId = null;
    this.showEdit = false;
    this.errorMessage = '';
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
    this.novaEmpresa.telefone = f;
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
    this.edicaoEmpresa.telefone = f;
  }
  
  private showToast(title: string, message: string, type: 'success' | 'error') {
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToastMessage = true;
    
    // Auto-hide toast after 4 seconds
    setTimeout(() => {
      this.hideToast();
    }, 4000);
  }
  
  hideToast() {
    this.showToastMessage = false;
  }
  
  abrirDetalhes(empresa: Empresa) {
    this.empresaDetalhes = empresa;
    this.showDetails = true;
    document.body.style.overflow = 'hidden';
  }
  
  fecharDetalhes() {
    this.empresaDetalhes = null;
    this.showDetails = false;
    document.body.style.overflow = 'auto';
  }
}
