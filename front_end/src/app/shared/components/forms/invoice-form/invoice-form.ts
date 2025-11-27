import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonComponent } from '../../ui/button/button';
import { InputComponent } from '../../ui/input/input';

interface InvoiceFormData {
  cliente_id: string;
  referencia: string;
  valor: number;
  custo?: number;
  glosa?: number;
  valor_liquido?: number;
  vencimento: string;
  status: 'pendente' | 'faturado' | 'nf_enviada' | 'pago' | 'cancelado';
  observacoes?: string;
}

interface Cliente {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Faturamento extends InvoiceFormData {
  id: string;
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.css'
})
export class InvoiceFormComponent implements OnInit, OnChanges {
  @Input() triggerButtonText: string = 'Novo Faturamento';
  @Input() clientes: Cliente[] = [];
  @Input() faturamento?: Faturamento;
  @Input() isOpen: boolean = false;
  
  @Output() invoiceCreated = new EventEmitter<InvoiceFormData>();
  @Output() invoiceUpdated = new EventEmitter<{ id: string; data: InvoiceFormData }>();
  @Output() formClosed = new EventEmitter<void>();
  @Output() openChange = new EventEmitter<boolean>();

  invoiceForm: FormGroup;
  internalOpen = false;

  readonly statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'faturado', label: 'Faturado' },
    { value: 'nf_enviada', label: 'NF Enviada' },
    { value: 'pago', label: 'Pago' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  constructor(private fb: FormBuilder) {
    this.invoiceForm = this.fb.group({
      cliente_id: ['', Validators.required],
      referencia: ['', Validators.required],
      valor: ['', [Validators.required, Validators.min(0.01)]],
      custo: [''],
      glosa: ['0'],
      valor_liquido: [''],
      vencimento: ['', Validators.required],
      status: ['pendente'],
      observacoes: ['']
    });
  }

  ngOnInit() {
    // Auto-calcular valor líquido quando valor, custo ou glosa mudarem
    this.invoiceForm.get('valor')?.valueChanges.subscribe(() => this.calculateValorLiquido());
    this.invoiceForm.get('custo')?.valueChanges.subscribe(() => this.calculateValorLiquido());
    this.invoiceForm.get('glosa')?.valueChanges.subscribe(() => this.calculateValorLiquido());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['faturamento'] && this.faturamento && this.isOpen) {
      this.populateForm();
    }
  }

  get open(): boolean {
    return this.isOpen || this.internalOpen;
  }

  get clientesAtivos(): Cliente[] {
    return this.clientes.filter(cliente => cliente.ativo);
  }

  get isEditing(): boolean {
    return !!this.faturamento;
  }

  openDialog() {
    this.internalOpen = true;
    this.openChange.emit(true);
  }

  closeDialog() {
    this.internalOpen = false;
    this.resetForm();
    this.openChange.emit(false);
    this.formClosed.emit();
  }

  populateForm() {
    if (!this.faturamento) return;

    this.invoiceForm.patchValue({
      cliente_id: this.faturamento.cliente_id,
      referencia: this.faturamento.referencia,
      valor: this.faturamento.valor,
      custo: this.faturamento.custo || '',
      glosa: this.faturamento.glosa || 0,
      valor_liquido: this.faturamento.valor_liquido || '',
      vencimento: this.faturamento.vencimento,
      status: this.faturamento.status,
      observacoes: this.faturamento.observacoes || ''
    });
  }

  resetForm() {
    this.invoiceForm.reset({
      cliente_id: '',
      referencia: '',
      valor: '',
      custo: '',
      glosa: '0',
      valor_liquido: '',
      vencimento: '',
      status: 'pendente',
      observacoes: ''
    });
  }

  calculateValorLiquido() {
    const valor = parseFloat(this.invoiceForm.get('valor')?.value || '0');
    const custo = parseFloat(this.invoiceForm.get('custo')?.value || '0');
    const glosa = parseFloat(this.invoiceForm.get('glosa')?.value || '0');
    
    const valorLiquido = valor - custo - glosa;
    this.invoiceForm.get('valor_liquido')?.setValue(valorLiquido.toFixed(2), { emitEvent: false });
  }

  onSubmit() {
    if (this.invoiceForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.invoiceForm.value;
    const invoiceData: InvoiceFormData = {
      ...formValue,
      valor: parseFloat(formValue.valor),
      custo: formValue.custo ? parseFloat(formValue.custo) : undefined,
      glosa: formValue.glosa ? parseFloat(formValue.glosa) : undefined,
      valor_liquido: formValue.valor_liquido ? parseFloat(formValue.valor_liquido) : undefined
    };

    if (this.isEditing && this.faturamento) {
      this.invoiceUpdated.emit({
        id: this.faturamento.id,
        data: invoiceData
      });
    } else {
      this.invoiceCreated.emit(invoiceData);
    }

    this.closeDialog();
  }

  getFieldError(fieldName: string): string | null {
    const field = this.invoiceForm.get(fieldName);
    if (field?.errors && field.touched) {
      const errors = field.errors;
      if (errors['required']) return `${this.getFieldLabel(fieldName)} é obrigatório`;
      if (errors['min']) return `${this.getFieldLabel(fieldName)} deve ser maior que 0`;
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'cliente_id': 'Cliente',
      'referencia': 'Referência',
      'valor': 'Valor',
      'vencimento': 'Data de vencimento'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched() {
    Object.keys(this.invoiceForm.controls).forEach(key => {
      const control = this.invoiceForm.get(key);
      control?.markAsTouched();
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
