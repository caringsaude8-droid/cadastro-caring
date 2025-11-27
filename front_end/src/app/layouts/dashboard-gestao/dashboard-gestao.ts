import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarCadastro } from '../../shared/components/sidebar-cadastro/sidebar-cadastro';

@Component({
  selector: 'app-dashboard-gestao',
  imports: [CommonModule, RouterOutlet, SidebarCadastro],
  templateUrl: './dashboard-gestao.html',
  styleUrl: './dashboard-gestao.css',
})
export class DashboardGestao {
  constructor(private router: Router) {}
}
