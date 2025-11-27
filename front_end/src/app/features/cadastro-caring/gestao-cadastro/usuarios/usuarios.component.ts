import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDetailsModalComponent } from './components/user-details-modal/user-details-modal.component';
import { UserFormModalComponent } from './components/user-form-modal/user-form-modal.component';

interface User {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  senha: string;
  status: 'ativo' | 'inativo';
  telefone: string;
  perfil: 'admin' | 'terapeuta' | 'recepcao' | 'supervisor';
  usuario: string;
  codigo: string;
  dataUltimoAcesso: string;
  dataCriacao: string;
  avatar?: string;
  especialidades?: string[];
  departamento?: string;
}

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
  
  users: User[] = [
    {
      id: '1',
      cpf: '123.456.789-01',
      nome: 'Ana Santos Silva',
      email: 'ana.santos@caring.com',
      senha: '',
      telefone: '(11) 99999-0001',
      perfil: 'admin',
      status: 'ativo',
      dataUltimoAcesso: '2024-01-26',
      dataCriacao: '2023-01-15',
      usuario: 'ana.santos',
      codigo: 'U001',
      departamento: 'Administração'
    },
    {
      id: '2',
      cpf: '234.567.890-12',
      nome: 'Dr. Pedro Lima Costa',
      email: 'pedro.lima@caring.com',
      senha: '',
      telefone: '(11) 99999-0002',
      perfil: 'terapeuta',
      status: 'ativo',
      dataUltimoAcesso: '2024-01-25',
      dataCriacao: '2023-03-20',
      usuario: 'pedro.lima',
      codigo: 'U002',
      especialidades: ['ABA', 'Fonoaudiologia'],
      departamento: 'TEA'
    },
    {
      id: '5',
      cpf: '456.789.012-34',
      nome: 'Julia Ferreira',
      email: 'julia.ferreira@caring.com',
      senha: '',
      telefone: '(11) 99999-0005',
      perfil: 'terapeuta',
      status: 'ativo',
      dataUltimoAcesso: '2024-01-20',
      dataCriacao: '2024-01-15',
      usuario: 'julia.ferreira',
      codigo: 'U005',
      especialidades: ['Psicologia'],
      departamento: 'TEA'
    }
  ];

  filteredUsers: User[] = [];

  constructor() {}

  ngOnInit() {
    this.filteredUsers = [...this.users];
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

  getStatusClass(status: string): string {
    return `status-${status}`;
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
    this.formMode = 'edit';
    this.selectedUser = user;
    this.showUserFormModal = true;
    this.closeUserDetailsModal();
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
      id: userData.id.toString(),
      dataUltimoAcesso: typeof userData.dataUltimoAcesso === 'string' ? userData.dataUltimoAcesso : userData.dataUltimoAcesso.toISOString(),
      dataCriacao: typeof userData.dataCriacao === 'string' ? userData.dataCriacao : userData.dataCriacao.toISOString()
    };

    if (this.formMode === 'create') {
      this.users.push({
        ...userToSave,
        dataUltimoAcesso: new Date().toISOString(),
        dataCriacao: new Date().toISOString()
      });
    } else {
      const index = this.users.findIndex(u => u.id === userToSave.id);
      if (index !== -1) {
        this.users[index] = {
          ...userToSave,
          dataUltimoAcesso: this.users[index].dataUltimoAcesso,
          dataCriacao: this.users[index].dataCriacao
        };
      }
    }
    
    this.closeUserFormModal();
  }
}
