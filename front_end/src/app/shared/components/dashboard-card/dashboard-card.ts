import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent } from '../ui/card/card';

interface Trend {
  value: number;
  label: string;
}

type DashboardCardVariant = 'default' | 'red' | 'teal';

@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule, CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent],
  templateUrl: './dashboard-card.html',
  styleUrl: './dashboard-card.css'
})
export class DashboardCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = '';
  @Input() trend?: Trend;
  @Input() variant: DashboardCardVariant = 'default';
  
  @Output() cardClick = new EventEmitter<void>();

  getCardClasses(): string {
    const variantStyles = {
      default: "border-border",
      red: "border-caring-red/20 bg-caring-red-light/50",
      teal: "border-caring-teal/20 bg-caring-teal-light/50"
    };

    return `caring-card cursor-pointer transition-all hover:scale-105 ${variantStyles[this.variant]}`;
  }

  getIconClasses(): string {
    const iconStyles = {
      default: "text-muted-foreground",
      red: "text-caring-red",
      teal: "text-caring-teal"
    };

    return `h-4 w-4 ${iconStyles[this.variant]}`;
  }

  getTrendClasses(): string {
    if (!this.trend) return '';
    
    if (this.trend.value > 0) return 'text-green-600';
    if (this.trend.value < 0) return 'text-red-600';
    return '';
  }

  getTrendPrefix(): string {
    return this.trend && this.trend.value > 0 ? '+' : '';
  }

  onCardClick(): void {
    this.cardClick.emit();
  }
}
