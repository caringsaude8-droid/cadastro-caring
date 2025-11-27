import { Routes } from '@angular/router';
import { DashboardGestao } from './layouts/dashboard-gestao/dashboard-gestao';
import { CadastroCaringComponent } from './features/cadastro-caring/cadastro-caring';
import { CadastroBeneficiariosComponent } from './features/cadastro-caring/beneficiarios/beneficiarios';
import { PesquisarBeneficiariosComponent } from './features/cadastro-caring/beneficiarios/pesquisar-beneficiarios/pesquisar-beneficiarios';
import { CadastroRelatoriosComponent } from './features/cadastro-caring/relatorios/relatorios';
import { EmpresasCadastroComponent } from './features/cadastro-caring/empresa/empresa';
import { AlteracaoCadastralComponent } from './features/cadastro-caring/beneficiarios/alteracao-cadastral/alteracao-cadastral';
import { InclusaoBeneficiarioComponent } from './features/cadastro-caring/beneficiarios/inclusao-beneficiario/inclusao-beneficiario';
import { ExclusaoCadastralComponent } from './features/cadastro-caring/beneficiarios/exclusao-cadastral/exclusao-cadastral';
import { ListagemCadastralComponent } from './features/cadastro-caring/beneficiarios/listagem-cadastral/listagem-cadastral';
import { GestaoCadastroComponent } from './features/cadastro-caring/gestao-cadastro/gestao-cadastro';
import { ConsultarBeneficiarioComponent } from './features/cadastro-caring/gestao-cadastro/consultar-beneficiario/consultar-beneficiario';
import { LoginComponent } from './core/login/login.component';
import { HomeComponent } from './features/home';
import { UsuariosComponent } from './features/cadastro-caring/gestao-cadastro/usuarios/usuarios.component';
import { AprovacaoCadastroComponent } from './features/cadastro-caring/gestao-cadastro/aprovacao-cadastro/aprovacao-cadastro';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'auth', component: LoginComponent },
  {
    path: '',
    component: DashboardGestao,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'cadastro-caring', component: CadastroCaringComponent },
      { path: 'cadastro-caring/gestao-cadastro', component: GestaoCadastroComponent },
      { path: 'cadastro-caring/gestao-cadastro/consultar-beneficiario', component: ConsultarBeneficiarioComponent },
      { path: 'cadastro-caring/gestao-cadastro/usuarios', component: UsuariosComponent },
      { path: 'cadastro-caring/gestao-cadastro/aprovacao-cadastro', component: AprovacaoCadastroComponent },
      { path: 'cadastro-caring/empresa', component: EmpresasCadastroComponent },
      { path: 'cadastro-caring/beneficiarios', component: PesquisarBeneficiariosComponent },
      { path: 'cadastro-caring/beneficiarios/inclusao', component: InclusaoBeneficiarioComponent },
      { path: 'cadastro-caring/beneficiarios/exclusao-cadastral', component: ExclusaoCadastralComponent },
      { path: 'cadastro-caring/beneficiarios/listagem-cadastral', component: ListagemCadastralComponent },
      { path: 'cadastro-caring/beneficiarios/alteracao-cadastral', component: AlteracaoCadastralComponent },
      { path: 'cadastro-caring/relatorios', component: CadastroRelatoriosComponent },
      { path: 'usuarios', redirectTo: 'cadastro-caring/gestao-cadastro/usuarios' },
    ]
  },
  { path: '**', redirectTo: '/home' }
];
