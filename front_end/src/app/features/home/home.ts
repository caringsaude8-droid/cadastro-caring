import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
      title: 'Usuários',
      description: 'Gestão de usuários do sistema',
      route: '/cadastro-caring/gestao-cadastro/usuarios',
      icon: 'users',
      color: 'teal',
      clickable: true
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    // Mock data - substituir por serviço real de autenticação
    this.userProfile = {
      nome: 'Dr. João Silva',
      perfil: 'Administrador'
    };
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  refreshData() {
    // Recarregar dados conforme necessário
  }
}
