import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../usuarios.service';

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
    nome: '',
    email: '',
    status: 'ativo',
    telefone: '',
    perfil: 'admin'
  };

  readonly perfilOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Usuario' }
  ];

  readonly statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' }
  ];

  get modalTitle(): string { return this.mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'; }
  get submitButtonText(): string { return this.mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'; }

  ngOnInit(): void { this.resetForm(); }
  ngOnChanges(changes: SimpleChanges): void {
    if (this.show && this.mode === 'edit' && this.user) {
      this.resetForm();
    }
  }

  resetForm(): void {
    if (this.mode === 'edit' && this.user) {
      this.formData = {
        nome: this.user.nome || '',
        email: this.user.email || '',
        status: this.user.status || 'ativo',
        telefone: this.user.telefone || '',
        perfil: this.user.perfil || 'admin'
      };
    } else {
      this.formData = {
        nome: '',
        email: '',
        status: 'ativo',
        telefone: '',
        perfil: 'admin'
      };
    }
  }

  onClose(): void { this.close.emit(); }

  onSubmit(): void {
    if (this.isFormValid()) {
      const userData: User = {
        id: this.mode === 'edit' && this.user ? this.user.id : Date.now(),
        nome: this.formData.nome!,
        email: this.formData.email!,
        status: this.formData.status as any,
        telefone: this.formData.telefone!,
        perfil: this.formData.perfil as any
      };

      this.save.emit(userData);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.nome?.trim() &&
      this.formData.email?.trim() &&
      this.formData.status &&
      this.formData.perfil
    );
  }
}
