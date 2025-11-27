import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class CardComponent {
  @Input() className: string = '';
  
  getClasses(): string {
    return `rounded-lg border bg-card text-card-foreground shadow-sm ${this.className}`;
  }
}

@Component({
  selector: 'ui-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `<div [class]="getClasses()"><ng-content></ng-content></div>`,
  styles: []
})
export class CardHeaderComponent {
  @Input() className: string = '';
  
  getClasses(): string {
    return `flex flex-col space-y-1.5 p-6 ${this.className}`;
  }
}

@Component({
  selector: 'ui-card-title',
  standalone: true,
  imports: [CommonModule],
  template: `<h3 [class]="getClasses()"><ng-content></ng-content></h3>`,
  styles: []
})
export class CardTitleComponent {
  @Input() className: string = '';
  
  getClasses(): string {
    return `text-2xl font-semibold leading-none tracking-tight ${this.className}`;
  }
}

@Component({
  selector: 'ui-card-description',
  standalone: true,
  imports: [CommonModule],
  template: `<p [class]="getClasses()"><ng-content></ng-content></p>`,
  styles: []
})
export class CardDescriptionComponent {
  @Input() className: string = '';
  
  getClasses(): string {
    return `text-sm text-muted-foreground ${this.className}`;
  }
}

@Component({
  selector: 'ui-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `<div [class]="getClasses()"><ng-content></ng-content></div>`,
  styles: []
})
export class CardContentComponent {
  @Input() className: string = '';
  
  getClasses(): string {
    return `p-6 pt-0 ${this.className}`;
  }
}

@Component({
  selector: 'ui-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `<div [class]="getClasses()"><ng-content></ng-content></div>`,
  styles: []
})
export class CardFooterComponent {
  @Input() className: string = '';
  
  getClasses(): string {
    return `flex items-center p-6 pt-0 ${this.className}`;
  }
}


