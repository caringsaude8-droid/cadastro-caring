import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  senha = '';
  loading = false;
  errorMessage = '';
  
  // Toast properties
  showToastMessage = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Faz logout automático se usuário estiver logado e acessar a página de login
    this.authService.autoSignOutOnLoginAccess();
  }

  clearForm() {
    this.email = '';
    this.senha = '';
    this.errorMessage = '';
  }

  handleLogin(event: Event) {
    event.preventDefault();
    
    if (!this.email || !this.senha) {
      this.errorMessage = 'Email e senha são obrigatórios';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = {
      email: this.email,
      senha: this.senha
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.showToast('Login realizado', `Bem-vindo, ${response.user.nome}!`, 'success');
        
        // Se usuário tem empresa vinculada, redirecionar para beneficiários
          if (response.user.perfil && response.user.perfil.toLowerCase() === 'user') {
            // Redireciona perfil 'user' para /cadastro-caring
            setTimeout(() => {
              this.router.navigate(['/cadastro-caring']);
            }, 500);
          } else if (response.user.empresaId) {
            // Redireciona outros perfis com empresa vinculada para beneficiários
            setTimeout(() => {
              this.router.navigate(['/cadastro-caring/beneficiarios']);
            }, 500);
          } else {
            this.router.navigate(['/home']);
          }
      },
      error: (error) => {
        console.error('Erro no login:', error);
        this.errorMessage = 'Email ou senha inválidos';
        this.showToast('Erro no login', 'Verifique suas credenciais', 'error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
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
}
