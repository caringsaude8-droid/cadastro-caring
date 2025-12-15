import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type LoadingState = { visible: boolean; message: string };

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
  private stateSubject = new BehaviorSubject<LoadingState>({ visible: false, message: '' });
  state$ = this.stateSubject.asObservable();

  show(message: string = 'Processando...') {
    this.stateSubject.next({ visible: true, message });
  }

  hide() {
    this.stateSubject.next({ visible: false, message: '' });
  }
}
