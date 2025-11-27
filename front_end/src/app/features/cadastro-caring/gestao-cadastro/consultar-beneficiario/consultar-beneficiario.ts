import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';
import { InputComponent } from '../../../../shared/components/ui/input/input';

type Clinica = { nome: string; cnpj: string; codigo: string; cidade: string; uf: string };

@Component({
  selector: 'app-consultar-beneficiario',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, InputComponent],
  templateUrl: './consultar-beneficiario.html',
  styleUrl: './consultar-beneficiario.css'
})
export class ConsultarBeneficiarioComponent {
  numeroBeneficiario = '';
  showModal = false;

  contrato = '';
  empresaCodigo = '';
  cpf = '';
  nome = '';
  tipoProduto: 'medico' | 'dental' | 'ambos' = 'ambos';
  tipoProposta: 'adesao' | 'pme' | 'ambos' = 'ambos';

  clinicas: Clinica[] = [];

  constructor(private router: Router) {
    const savedClinicas = localStorage.getItem('clinicas');
    if (savedClinicas) {
      try { this.clinicas = JSON.parse(savedClinicas) as Clinica[]; } catch {}
    }
    const selected = localStorage.getItem('selectedClinic');
    if (selected) {
      try { const s = JSON.parse(selected) as Clinica; this.empresaCodigo = s.codigo; } catch {}
    }
  }

  abrirModal() { this.showModal = true; document.body.style.overflow = 'hidden'; }
  fecharModal() { this.showModal = false; document.body.style.overflow = 'auto'; }

  pesquisar() {
    this.fecharModal();
    const query = new URLSearchParams({
      numeroBeneficiario: this.numeroBeneficiario,
      contrato: this.contrato,
      empresaCodigo: this.empresaCodigo,
      cpf: this.cpf,
      nome: this.nome,
      tipoProduto: this.tipoProduto,
      tipoProposta: this.tipoProposta
    }).toString();
    this.router.navigateByUrl(`/cadastro-caring/beneficiarios/listagem-cadastral?${query}`);
  }
}

