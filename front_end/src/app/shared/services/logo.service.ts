import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogoService {
  private readonly DEFAULT_LOGO = 'assets/logoCaring.png';
  private logoUrlSubject: BehaviorSubject<string>;
  
  // Observable for components to subscribe to logo changes
  logoUrl$;

  constructor() {
    // Load saved logo from localStorage immediately
    const savedLogo = this.loadLogoFromStorage();
    this.logoUrlSubject = new BehaviorSubject<string>(savedLogo);
    this.logoUrl$ = this.logoUrlSubject.asObservable();
  }

  getCurrentLogo(): string {
    return this.logoUrlSubject.value;
  }

  updateLogo(logoUrl: string): void {
    this.logoUrlSubject.next(logoUrl);
    this.saveLogoToStorage(logoUrl);
  }

  resetToDefault(): void {
    this.logoUrlSubject.next(this.DEFAULT_LOGO);
    this.removeLogoFromStorage();
  }

  private loadLogoFromStorage(): string {
    if (typeof localStorage !== 'undefined') {
      const savedLogo = localStorage.getItem('caring-logo-url');
      if (savedLogo) {
        return savedLogo;
      }
    }
    return this.DEFAULT_LOGO;
  }

  private saveLogoToStorage(logoUrl: string): void {
    if (typeof localStorage !== 'undefined') {
      if (logoUrl === this.DEFAULT_LOGO) {
        localStorage.removeItem('caring-logo-url');
      } else {
        localStorage.setItem('caring-logo-url', logoUrl);
      }
    }
  }

  private removeLogoFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('caring-logo-url');
    }
  }

  // Validate if the logo URL is accessible
  async validateLogoUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
}