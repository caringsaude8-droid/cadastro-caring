import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.html',
  styleUrl: './input.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() className: string = '';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() readonly: boolean = false;
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() step: string = '';
  @Input() min: string = '';
  @Input() maxlength: number | null = null;
  @Input() onlyDigits: boolean = false;
  @Input() allowPhoneChars: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  value: string = '';
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  getClasses(): string {
    const baseClasses = "modern-input";
    return `${baseClasses} ${this.className}`;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let incoming = target.value || '';
    if (this.onlyDigits) {
      incoming = incoming.replace(/\D/g, '');
      if (typeof this.maxlength === 'number' && this.maxlength > 0) {
        incoming = incoming.slice(0, this.maxlength);
      }
    } else if (this.allowPhoneChars) {
      let res = '';
      let count = 0;
      for (const ch of incoming) {
        if (/\d/.test(ch)) {
          if (count < 11) {
            res += ch;
            count++;
          }
        } else if (/[()\-\s]/.test(ch)) {
          res += ch;
        }
      }
      incoming = res;
    }
    // Reflect sanitized value immediately in the DOM to block non-digit visuals
    target.value = incoming;
    this.value = incoming;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    const navKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
    if (navKeys.includes(key)) return;
    if ((event.ctrlKey || event.metaKey) && (key === 'a' || key === 'c' || key === 'v' || key === 'x')) return;

    if (this.onlyDigits) {
      const isDigit = /^[0-9]$/.test(key);
      if (!isDigit) {
        event.preventDefault();
        return;
      }
    } else if (this.allowPhoneChars) {
      const isAllowedChar = /^[0-9\(\)\-\s]$/.test(key);
      if (!isAllowedChar) {
        event.preventDefault();
        return;
      }
    } else {
      return;
    }

    if (typeof this.maxlength === 'number' && this.maxlength > 0) {
      const input = event.target as HTMLInputElement;
      const selStart = input.selectionStart ?? 0;
      const selEnd = input.selectionEnd ?? 0;
      const selectionLength = selEnd - selStart;
      const currentLength = (input.value || '').length;
      if (selectionLength === 0 && currentLength >= this.maxlength) {
        event.preventDefault();
      }
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
