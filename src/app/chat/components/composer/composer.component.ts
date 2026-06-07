import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * ComposerComponent — text input + submit button for the chat interface.
 *
 * Disabled while the store is busy (submitting / streaming) so users cannot
 * fire overlapping requests.  Emits a `submitted` event with the trimmed
 * question text, then resets the local input field.
 */
@Component({
  selector: 'atlas-composer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form class="composer" (ngSubmit)="onSubmit()">
      <textarea
        class="composer__input"
        [(ngModel)]="text"
        name="question"
        placeholder="Ask a regulatory question…"
        rows="2"
        [attr.disabled]="disabled() ? true : null"
        (keydown.enter)="onEnterKey($event)"
        aria-label="Question input"
      ></textarea>
      <button
        type="submit"
        class="composer__submit"
        [attr.disabled]="(disabled() || !text().trim()) ? true : null"
        aria-label="Send question"
      >
        @if (disabled()) {
          <span class="composer__spinner" aria-hidden="true"></span>
          Sending…
        } @else {
          Send
        }
      </button>
    </form>
  `,
  styles: `
    .composer {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid #dee2e6;
      background: #fff;
    }

    .composer__input {
      flex: 1;
      resize: none;
      border: 1px solid #ced4da;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.9375rem;
      font-family: inherit;
      line-height: 1.5;
      outline: none;
      transition: border-color 0.15s;

      &:focus {
        border-color: #0d6efd;
      }

      &:disabled {
        background: #f8f9fa;
        cursor: not-allowed;
      }
    }

    .composer__submit {
      align-self: flex-end;
      padding: 0.5rem 1.25rem;
      background: #0d6efd;
      color: #fff;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.9375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      white-space: nowrap;
      transition: background 0.15s;

      &:hover:not(:disabled) {
        background: #0b5ed7;
      }

      &:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }
    }

    .composer__spinner {
      display: inline-block;
      width: 0.85rem;
      height: 0.85rem;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `,
})
export class ComposerComponent {
  /** True while the store is submitting or streaming — disables the whole form. */
  readonly disabled = input<boolean>(false);

  /** Emits the trimmed question text when the user submits. */
  readonly submitted = output<string>();

  protected readonly text = signal('');

  protected onSubmit(): void {
    const trimmed = this.text().trim();
    if (!trimmed || this.disabled()) return;
    this.submitted.emit(trimmed);
    this.text.set('');
  }

  /**
   * Submit on Enter (without Shift).  Shift+Enter inserts a newline as usual.
   */
  protected onEnterKey(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.onSubmit();
    }
  }
}
