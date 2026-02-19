import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';

@Component({
  selector: 'app-button',
  template: `
    <button
      [type]="type()"
      [attr.aria-label]="ariaLabel()"
      [disabled]="disabled()"
      [class]="buttonClass()"
      (click)="buttonClick.emit($event)"
    >
      <ng-content />
    </button>
  `,
  styleUrl: 'button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly variant = input<ButtonVariant>('primary');
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly buttonClick = output<Event>();

  protected readonly buttonClass = computed(
    () => `button button--${this.variant()}`,
  );
}
