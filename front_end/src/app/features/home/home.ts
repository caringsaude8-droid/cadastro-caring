import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../../core/services/auth.service';

interface QuickAction {
  title: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  clickable: boolean;
}





interface UserProfile {
  nome: string;
  perfil: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  userProfile: UserProfile | null = null;

  quickActions: QuickAction[] = [
    {
      title: 'Cadastro Caring',
      description: 'Módulo de cadastros do sistema',
      route: '/cadastro-caring',
      icon: 'calendar',
      color: 'orange',
      clickable: true
    },
    {
      title: 'Gestão de Usuários',
      description: 'Gestão de usuários do sistema',
      route: '/cadastro-caring/gestao-cadastro/usuarios',
      icon: 'users',
      color: 'teal',
      clickable: true
    }
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userProfile = { nome: user.nome, perfil: user.perfil };
    }
    this.authService.currentUser$.subscribe((u: AuthUser | null) => {
      if (u) {
        this.userProfile = { nome: u.nome, perfil: u.perfil };
      }
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  refreshData() {
    // Recarregar dados conforme necessário
  }
}
