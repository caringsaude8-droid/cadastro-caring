import { Routes } from '@angular/router';
import { DashboardGestao } from './layouts/dashboard-gestao/dashboard-gestao';
import { CadastroCaringComponent } from './features/cadastro-caring/cadastro-caring';
import { CadastroBeneficiariosComponent } from './features/cadastro-caring/beneficiarios/beneficiarios';
import { PesquisarBeneficiariosComponent } from './features/cadastro-caring/beneficiarios/pesquisar-beneficiarios/pesquisar-beneficiarios';
import { CadastroRelatoriosComponent } from './features/cadastro-caring/relatorios/relatorios';
import { RelatoriosCadastroComponent } from './features/cadastro-caring/gestao-cadastro/relatorios-cadastro/relatorios-cadastro';
import { EmpresasCadastroComponent } from './features/cadastro-caring/empresa/empresa';
import { AlteracaoCadastralComponent } from './features/cadastro-caring/beneficiarios/alteracao-cadastral/alteracao-cadastral';
import { InclusaoBeneficiarioComponent } from './features/cadastro-caring/beneficiarios/inclusao-beneficiario/inclusao-beneficiario';
import { ExclusaoCadastralComponent } from './features/cadastro-caring/beneficiarios/exclusao-cadastral/exclusao-cadastral';
import { CartaoVirtualComponent } from './features/cadastro-caring/beneficiarios/cartao-virtual/cartao-virtual';
import { SolicitacaoCadastroComponent } from './features/cadastro-caring/beneficiarios/solicitacao-cadastro/solicitacao-cadastro';
import { RelatorioBeneficiariosComponent } from './features/cadastro-caring/beneficiarios/relatorio-beneficiarios/relatorio-beneficiarios';
import { RelatorioSolicitacaoComponent } from './features/cadastro-caring/beneficiarios/relatorio-solicitacao/relatorio-solicitacao';
import { GestaoCadastroComponent } from './features/cadastro-caring/gestao-cadastro/gestao-cadastro';
import { ConsultarBeneficiarioComponent } from './features/cadastro-caring/gestao-cadastro/consultar-beneficiario/consultar-beneficiario';
import { LoginComponent } from './core/login/login.component';
import { HomeComponent } from './features/home';
import { UsuariosComponent } from './features/cadastro-caring/gestao-cadastro/usuarios/usuarios.component';
import { AprovacaoCadastroComponent } from './features/cadastro-caring/gestao-cadastro/aprovacao-cadastro/aprovacao-cadastro';
import { authGuard } from './core/guards/auth-guard';
import { loginGuard } from './core/guards/login.guard';
import { empresaGuard } from './core/guards/empresa.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'auth', component: LoginComponent, canActivate: [loginGuard] },
  {
    path: '',
    component: DashboardGestao,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: HomeComponent, canActivate: [authGuard], data: { profiles: ['admin', 'gestor'] } },
      { path: 'cadastro-caring', component: CadastroCaringComponent },
      { path: 'cadastro-caring/gestao-cadastro', component: GestaoCadastroComponent, canActivate: [authGuard], data: { profiles: ['admin', 'gestor'] } },
      { path: 'cadastro-caring/gestao-cadastro/consultar-beneficiario', component: ConsultarBeneficiarioComponent, canActivate: [authGuard], data: { profiles: ['admin', 'gestor'] } },
      { path: 'cadastro-caring/gestao-cadastro/usuarios', component: UsuariosComponent, canActivate: [authGuard], data: { profiles: ['admin', 'gestor'] } },
      { path: 'cadastro-caring/gestao-cadastro/aprovacao-cadastro', component: AprovacaoCadastroComponent, canActivate: [authGuard], data: { profiles: ['admin', 'gestor'] } },
      { path: 'cadastro-caring/empresa', component: EmpresasCadastroComponent, canActivate: [authGuard], data: { profiles: ['admin', 'gestor'] } },
      { path: 'cadastro-caring/beneficiarios', component: PesquisarBeneficiariosComponent, canActivate: [empresaGuard] },
      { path: 'cadastro-caring/beneficiarios/inclusao', component: InclusaoBeneficiarioComponent, canActivate: [empresaGuard] },
      { path: 'cadastro-caring/beneficiarios/exclusao-cadastral', component: ExclusaoCadastralComponent, canActivate: [empresaGuard] },
      { path: 'cadastro-caring/beneficiarios/cartao-virtual', component: CartaoVirtualComponent, canActivate: [empresaGuard] },
      { path: 'cadastro-caring/beneficiarios/alteracao-cadastral', component: AlteracaoCadastralComponent, canActivate: [empresaGuard] },
      { path: 'cadastro-caring/beneficiarios/solicitacao-cadastro', component: SolicitacaoCadastroComponent, canActivate: [empresaGuard] },
      { path: 'cadastro-caring/beneficiarios/relatorio-beneficiarios', component: RelatorioBeneficiariosComponent, canActivate: [empresaGuard] },
      { path: 'cadastro-caring/beneficiarios/relatorio-solicitacao', component: RelatorioSolicitacaoComponent, canActivate: [empresaGuard] },
      { path: 'cadastro-caring/gestao-cadastro/relatorios-cadastro', component: RelatoriosCadastroComponent },
      { path: 'cadastro-caring/relatorios', redirectTo: 'cadastro-caring/gestao-cadastro/relatorios-cadastro' },
      { path: 'usuarios', redirectTo: 'cadastro-caring/gestao-cadastro/usuarios' },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
