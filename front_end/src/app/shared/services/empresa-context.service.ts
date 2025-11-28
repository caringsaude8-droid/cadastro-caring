import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Empresa } from '../../features/cadastro-caring/empresa/empresa.service';

@Injectable({
  providedIn: 'root'
})
export class EmpresaContextService {
  private empresaSelecionadaSubject = new BehaviorSubject<Empresa | null>(null);
  
  empresaSelecionada$ = this.empresaSelecionadaSubject.asObservable();

  setEmpresaSelecionada(empresa: Empresa | null) {
    this.empresaSelecionadaSubject.next(empresa);
    
    // Salvar no localStorage para persistir entre navegações
    if (empresa) {
      localStorage.setItem('empresaSelecionada', JSON.stringify(empresa));
    } else {
      localStorage.removeItem('empresaSelecionada');
    }
  }

  getEmpresaSelecionada(): Empresa | null {
    const current = this.empresaSelecionadaSubject.value;
    
    // Se não há empresa no subject, tentar recuperar do localStorage
    if (!current) {
      const stored = localStorage.getItem('empresaSelecionada');
      if (stored) {
        try {
          const empresa = JSON.parse(stored);
          this.empresaSelecionadaSubject.next(empresa);
          return empresa;
        } catch (e) {
          localStorage.removeItem('empresaSelecionada');
        }
      }
    }
    
    return current;
  }

  clearEmpresaSelecionada() {
    this.setEmpresaSelecionada(null);
  }

  hasEmpresaSelecionada(): boolean {
    return this.getEmpresaSelecionada() !== null;
  }
}