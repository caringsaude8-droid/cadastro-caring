import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LogoService } from '../../services/logo.service';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem { title: string; url: string; icon: string; }
interface SubMenuItem { title: string; url: string; }

@Component({
  selector: 'app-sidebar-cadastro',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-cadastro.html',
  styleUrl: '../sidebar/sidebar.css'
})
export class SidebarCadastro implements OnInit, OnDestroy {
  collapsed = false;
  cadastroCaringOpen = true;
  beneficiariosOpen = false;
  movClienteOpen = false;
  selectedMovAction: string | null = null;
  profile: any = null;
  logoUrl: string | null = null;
  currentRoute: string = '';
  private logoSubscription?: Subscription;
  private routeSubscription?: Subscription;

  topMenuItems: MenuItem[] = [
    { title: 'Home', url: '/home', icon: 'home' }
  ];

  cadastroCaringSubItems: SubMenuItem[] = [
    { title: 'Visão Geral', url: '/cadastro-caring' }
  ];

  beneficiariosSubItems: SubMenuItem[] = [
    { title: 'Inclusão', url: '/cadastro-caring/beneficiarios/inclusao' },
    { title: 'Alteração Cadastral', url: '/cadastro-caring/beneficiarios' },
    { title: 'Pesquisar', url: '/cadastro-caring/beneficiarios/listagem-cadastral' },
    { title: 'Solicitação de Cadastro', url: '/cadastro-caring/beneficiarios/solicitacao-cadastro' }
  ];


  constructor(
    private router: Router, 
    private logoService: LogoService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.profile = { nome: 'Usuário Teste', perfil: 'admin' };
    this.logoSubscription = this.logoService.logoUrl$.subscribe(url => (this.logoUrl = url));
    this.currentRoute = this.router.url;
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => { this.currentRoute = event.urlAfterRedirects; });
  }

  ngOnDestroy() {
    if (this.logoSubscription) this.logoSubscription.unsubscribe();
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    const mainElement = document.querySelector('main');
    if (mainElement) {
      if (this.collapsed) mainElement.classList.add('sidebar-collapsed');
      else mainElement.classList.remove('sidebar-collapsed');
    }
  }

  toggleCadastroCaring() { this.cadastroCaringOpen = !this.cadastroCaringOpen; }
  toggleBeneficiarios() { this.beneficiariosOpen = !this.beneficiariosOpen; }
  toggleMovCliente() { this.movClienteOpen = !this.movClienteOpen; }
  selectMovAction(action: string) { this.selectedMovAction = action; }

  goCadastroHome() { this.router.navigate(['/cadastro-caring']); }

  isActive(path: string): boolean {
    if (path === '/home') return this.router.url === '/home' || this.router.url === '/';
    return this.router.url.startsWith(path);
  }

  signOut() { 
    this.authService.signOut();
    this.router.navigate(['/login']); 
  }
  navigateTo(url: string) { this.router.navigate([url]); }
}
