import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-cadastro-caring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-caring.html',
  styleUrl: './cadastro-caring.css'
})
export class CadastroCaringComponent implements OnInit {
  userProfile: UserProfile | null = null;
  quickActions: QuickAction[] = [
    {
      title: 'Beneficiários',
      description: 'Gestão de beneficiários',
      route: '/cadastro-caring/beneficiarios',
      icon: 'users',
      color: 'blue',
      clickable: true
    },
    {
      title: 'Usuários',
      description: 'Em definição',
      route: '/cadastro-caring',
      icon: 'users',
      color: 'blue',
      clickable: false
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.userProfile = { nome: 'Dr. João Silva', perfil: 'Administrador' };
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
