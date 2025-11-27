import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  clearForm() {
    this.email = '';
    this.senha = '';
  }

  async handleLogin(event: Event) {
    event.preventDefault();
    this.loading = true;

    try {
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation
      if (this.email && this.senha) {
        this.showToast('Login realizado', 'Bem-vindo ao Gestão Caring!', 'success');
        this.router.navigate(['/dashboard']);
      } else {
        this.showToast('Erro no login', 'Email e senha são obrigatórios', 'error');
      }
    } catch (error) {
      this.showToast('Erro', 'Ocorreu um erro inesperado', 'error');
    } finally {
      this.loading = false;
    }
  }

  private showToast(title: string, message: string, type: 'success' | 'error') {
    // Mock toast implementation
    const toast = {
      title,
      message,
      type,
      timestamp: new Date()
    };
    console.log('Toast:', toast);
    
    // In a real app, you would integrate with a toast service
    alert(`${title}: ${message}`);
  }
}
