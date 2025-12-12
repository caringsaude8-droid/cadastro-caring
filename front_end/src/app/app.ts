import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ErrorService, GlobalError, GlobalInfo } from './shared/services/error.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('caring-flow');
  error: GlobalError | null = null;
  info: GlobalInfo | null = null;

  constructor(private errorService: ErrorService) {
    this.errorService.error$.subscribe(e => {
      this.error = e;
    });
    this.errorService.info$.subscribe(i => {
      this.info = i;
      if (i) {
        setTimeout(() => { if (this.info === i) this.info = null; }, 2500);
      }
    });
  }
}
