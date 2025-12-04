import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserDetailsModalComponent } from './components/user-details-modal/user-details-modal.component';
import { UserFormModalComponent } from './components/user-form-modal/user-form-modal.component';
import { UsuariosService, User } from './usuarios.service';



interface UserStats {
  total: number;
  ativos: number;
  inativos: number;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, UserDetailsModalComponent, UserFormModalComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  searchTerm: string = '';
  selectedPerfil: string = '';
  selectedStatus: string = '';
  showUserDetailsModal: boolean = false;
  showUserFormModal: boolean = false;
  formMode: 'create' | 'edit' = 'create';
  selectedUser: User | null = null;
  
  users: User[] = [];

  filteredUsers: User[] = [];

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit() {
    this.usuariosService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.users = usuarios;
        this.filteredUsers = [...this.users];
      },
      error: (err) => {
        // Em caso de erro, mantém lista vazia
        this.users = [];
        this.filteredUsers = [];
      }
    });
  }

  get stats(): UserStats {
    return {
      total: this.users.length,
      ativos: this.users.filter(u => u.status === 'ativo').length,
      inativos: this.users.filter(u => u.status === 'inativo').length
    };
  }

  onSearch(): void {
    this.filterUsers();
  }

  onPerfilChange(): void {
    this.filterUsers();
  }

  onStatusChange(): void {
    this.filterUsers();
  }

  private filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.nome.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesPerfil = !this.selectedPerfil || user.perfil === this.selectedPerfil;
      const matchesStatus = !this.selectedStatus || user.status === this.selectedStatus;

      return matchesSearch && matchesPerfil && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedPerfil = '';
    this.selectedStatus = '';
    this.filteredUsers = [...this.users];
  }

  getPerfilLabel(perfil: string): string {
    const labels: { [key: string]: string } = {
      'admin': 'Administrador',
      'terapeuta': 'Admin TEA'
    };
    return labels[perfil] || perfil;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'ativo': 'Ativo',
      'inativo': 'Inativo'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string | boolean | undefined): string {
    let s = '';
    if (status === true || status === 'ativo') s = 'ativo';
    else if (status === false || status === 'inativo') s = 'inativo';
    else if (typeof status === 'string') s = status;
    return `status-${s}`;
  }

  getPerfilClass(perfil: string): string {
    return `perfil-${perfil}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  getDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ontem';
    if (diffDays === 0) return 'Hoje';
    return `${diffDays} dias atrás`;
  }

  openAddUserModal(): void {
    this.formMode = 'create';
    this.selectedUser = null;
    this.showUserFormModal = true;
  }

  editUser(user: User): void {
    this.closeUserDetailsModal();
    this.formMode = 'edit';
    this.selectedUser = { ...user };
    this.showUserFormModal = true;
  }

  viewUserDetails(user: User): void {
    this.selectedUser = user;
    this.showUserDetailsModal = true;
  }

  closeUserDetailsModal(): void {
    this.showUserDetailsModal = false;
    this.selectedUser = null;
  }

  closeUserFormModal(): void {
    this.showUserFormModal = false;
    this.selectedUser = null;
    this.formMode = 'create';
  }

  onSaveUser(userData: any): void {
    const userToSave: User = {
      ...userData,
      id: Number(userData.id),
      status: userData.status === true || userData.status === 'ativo' ? 'ativo' : 'inativo'
    };

    if (this.formMode === 'create') {
      this.users.push(userToSave);
    } else {
      const index = this.users.findIndex(u => u.id === userToSave.id);
      if (index !== -1) {
        this.users[index] = userToSave;
      }
    }
    this.filteredUsers = [...this.users];
    this.closeUserFormModal();
  }
}
