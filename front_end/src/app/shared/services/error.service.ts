import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export type GlobalError = {
  title: string;
  message: string;
  status?: number;
  details?: string;
  timestamp: number;
};

export type GlobalInfo = {
  message: string;
  timestamp: number;
};

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private errorSubject = new BehaviorSubject<GlobalError | null>(null);
  error$ = this.errorSubject.asObservable();
  private infoSubject = new BehaviorSubject<GlobalInfo | null>(null);
  info$ = this.infoSubject.asObservable();

  notify(message: string, title = 'Erro', details?: string, status?: number) {
    const e: GlobalError = {
      title,
      message,
      status,
      details,
      timestamp: Date.now()
    };
    this.errorSubject.next(e);
  }

  notifyHttp(error: HttpErrorResponse) {
    const status = error.status;
    const title = status >= 500 ? 'Erro no Servidor' : 'Falha na Operação';
    const message =
      (error.error && typeof error.error === 'string' && error.error) ||
      (error.error && error.error.message) ||
      error.message ||
      'Ocorreu um erro inesperado. Contate o suporte.';
    const details =
      status ? `Código: ${status}` : undefined;
    this.notify(message, title, details, status);
  }

  clear() {
    this.errorSubject.next(null);
  }

  notifyInfo(message: string) {
    this.infoSubject.next({ message, timestamp: Date.now() });
  }
}
