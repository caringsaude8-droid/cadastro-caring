import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-cadastro-caring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-caring.html',
  styleUrl: './cadastro-caring.css'
})
export class CadastroCaringComponent implements OnInit {
  userProfile: AuthUser | null = null;
  quickActions: QuickAction[] = [
    {
      title: 'Beneficiários',
      description: 'Gestão de beneficiários',
      route: '/cadastro-caring/beneficiarios',
      icon: 'users',
      color: 'blue',
      clickable: true
    }
  ];

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.userProfile = this.authService.getCurrentUser();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
