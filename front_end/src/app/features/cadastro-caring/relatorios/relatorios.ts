import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cadastro-relatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css'
})
export class CadastroRelatoriosComponent {
  title = 'Relatórios - Cadastro Caring';
}

