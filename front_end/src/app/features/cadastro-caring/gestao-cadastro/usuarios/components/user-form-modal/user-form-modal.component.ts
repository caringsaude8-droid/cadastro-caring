import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface User {
  id: string | number;
  cpf: string;
  nome: string;
  email: string;
  senha: string;
  status: 'ativo' | 'inativo';
  telefone: string;
  perfil: 'admin' | 'terapeuta' | 'recepcao' | 'supervisor';
  usuario: string;
  codigo: string;
  dataUltimoAcesso: string | Date;
  dataCriacao: string | Date;
}

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-form-modal.component.html',
  styleUrls: ['./user-form-modal.component.css']
})
export class UserFormModalComponent implements OnInit, OnChanges {
  @Input() show: boolean = false;
  @Input() user: User | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<User>();

  formData: Partial<User> = {
    cpf: '',
    nome: '',
    email: '',
    senha: '',
    status: 'ativo',
    telefone: '',
    perfil: 'recepcao',
    usuario: '',
    codigo: ''
  };

  readonly perfilOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'terapeuta', label: 'Admin TEA' }
  ];

  readonly statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' }
  ];

  get modalTitle(): string { return this.mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'; }
  get submitButtonText(): string { return this.mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'; }

  ngOnInit(): void { this.resetForm(); }
  ngOnChanges(): void { if (this.show) { this.resetForm(); } }

  resetForm(): void {
    if (this.mode === 'edit' && this.user) {
      this.formData = { ...this.user };
    } else {
      this.formData = {
        cpf: '',
        nome: '',
        email: '',
        senha: '',
        status: 'ativo',
        telefone: '',
        perfil: 'recepcao',
        usuario: '',
        codigo: ''
      };
    }
  }

  onClose(): void { this.close.emit(); }

  onSubmit(): void {
    if (this.isFormValid()) {
      const userData: User = {
        id: this.mode === 'edit' && this.user ? this.user.id : Date.now(),
        cpf: this.formData.cpf!,
        nome: this.formData.nome!,
        email: this.formData.email!,
        senha: this.formData.senha!,
        status: this.formData.status as any,
        telefone: this.formData.telefone!,
        perfil: this.formData.perfil as any,
        usuario: this.formData.usuario!,
        codigo: this.formData.codigo!,
        dataUltimoAcesso: this.mode === 'edit' && this.user ? this.user.dataUltimoAcesso : new Date(),
        dataCriacao: this.mode === 'edit' && this.user ? this.user.dataCriacao : new Date()
      };

      this.save.emit(userData);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.cpf?.trim() &&
      this.formData.nome?.trim() &&
      this.formData.email?.trim() &&
      this.formData.senha?.trim() &&
      this.formData.status &&
      this.formData.telefone?.trim() &&
      this.formData.perfil &&
      this.formData.usuario?.trim() &&
      this.formData.codigo?.trim()
    );
  }
}
