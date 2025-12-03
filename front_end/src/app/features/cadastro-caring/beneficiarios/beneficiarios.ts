import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmpresaContextService } from '../../../shared/services/empresa-context.service';

@Component({
  selector: 'app-cadastro-beneficiarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './beneficiarios.html',
  styleUrl: './beneficiarios.css'
})
export class CadastroBeneficiariosComponent implements OnInit {
  pageTitle = 'Beneficiários';
  loading = false;
  selectedAction: string | null = null;
  empresaSelecionada: any = null;
  actions = [
    { id: 'inclusao-titular', title: 'Inclusão de Titular', icon: 'users', color: 'blue' },
    { id: 'inclusao-dependente', title: 'Inclusão de Dependente', icon: 'users', color: 'green' },
    { id: 'alteracao-cadastral', title: 'Alteração Cadastral', icon: 'dashboard', color: 'orange' },
    { id: 'troca-plano', title: 'Troca de Plano', icon: 'calendar', color: 'purple' },
    { id: 'exclusao', title: 'Exclusão', icon: 'dashboard', color: 'teal' },
    { id: 'importacao-arquivo', title: 'Importação de Arquivo', icon: 'dashboard', color: 'gray' },
    { id: 'consulta-pendentes', title: 'Consulta Movimentações Pendentes', icon: 'dashboard', color: 'blue' }
  ];

  constructor(
    private router: Router,
    private empresaContextService: EmpresaContextService
  ) {}

  ngOnInit() {
    this.loading = false;
    this.empresaSelecionada = this.empresaContextService.getEmpresaSelecionada();
    console.log('🏠 Beneficiarios: Empresa carregada =', this.empresaSelecionada);
  }

  trocarEmpresa() {
    this.empresaContextService.clearEmpresaSelecionada();
    this.router.navigate(['/cadastro-caring/empresa']);
  }

  selectAction(id: string) {
    this.selectedAction = id;
    if (id === 'inclusao-titular') this.router.navigate(['/cadastro-caring/beneficiarios/inclusao']);
  }
}
