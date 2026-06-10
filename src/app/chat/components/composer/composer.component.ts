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
      gap: 0.6rem;
      padding: 1rem 1.5rem 1.5rem;
      border-top: 1px solid var(--line-2);
      background: linear-gradient(180deg, transparent, var(--ink-850) 60%);
    }

    .composer__input {
      flex: 1;
      resize: none;
      color: var(--bone);
      background: var(--ink-750);
      border: 1px solid var(--line-2);
      border-radius: var(--r-md);
      padding: 0.75rem 0.9rem;
      font-size: 0.95rem;
      font-family: var(--font-sans);
      line-height: 1.5;
      outline: none;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;

      &::placeholder { color: var(--bone-faint); }

      &:focus {
        border-color: var(--gilt-deep);
        box-shadow: 0 0 0 3px var(--gilt-wash);
      }

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    }

    .composer__submit {
      align-self: stretch;
      min-width: 7.5rem;
      padding: 0 1.4rem;
      background: linear-gradient(180deg, var(--gilt), var(--gilt-deep));
      color: var(--ink-900);
      border: none;
      border-radius: var(--r-md);
      font-family: var(--font-sans);
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      white-space: nowrap;
      transition: filter 0.15s ease, transform 0.1s ease;

      &:hover:not(:disabled) { filter: brightness(1.08); }
      &:active:not(:disabled) { transform: translateY(1px); }

      &:disabled {
        background: var(--ink-700);
        color: var(--bone-faint);
        cursor: not-allowed;
      }
    }

    .composer__spinner {
      display: inline-block;
      width: 0.85rem;
      height: 0.85rem;
      border: 2px solid rgba(20, 17, 13, 0.3);
      border-top-color: var(--ink-900);
      border-radius: 50%;
      animation: atlas-spin 0.7s linear infinite;
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
