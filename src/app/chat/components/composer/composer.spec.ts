import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { ComposerComponent } from './composer';

describe('ComposerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComposerComponent],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(ComposerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('textarea and button are enabled by default', () => {
    const fixture = TestBed.createComponent(ComposerComponent);
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.debugElement.query(
      By.css('.composer__input'),
    ).nativeElement;
    expect(textarea.disabled).toBe(false);
  });

  it('disables textarea and button when disabled input is true', () => {
    const fixture = TestBed.createComponent(ComposerComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.debugElement.query(
      By.css('.composer__input'),
    ).nativeElement;
    const button: HTMLButtonElement = fixture.debugElement.query(
      By.css('.composer__submit'),
    ).nativeElement;

    expect(textarea.disabled).toBe(true);
    expect(button.disabled).toBe(true);
  });

  it('shows spinner text when disabled', () => {
    const fixture = TestBed.createComponent(ComposerComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.debugElement.query(
      By.css('.composer__submit'),
    ).nativeElement;
    expect(button.textContent).toContain('Sending');
  });

  it('emits submitted with trimmed text on form submit', async () => {
    const fixture = TestBed.createComponent(ComposerComponent);
    fixture.detectChanges();

    const emittedValues: string[] = [];
    fixture.componentInstance.submitted.subscribe((v: string) => emittedValues.push(v));

    // Set the text signal directly
    fixture.componentInstance['text'].set('  What is REACH?  ');
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('.composer'));
    form.triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(emittedValues).toEqual(['What is REACH?']);
  });

  it('clears input after submission', async () => {
    const fixture = TestBed.createComponent(ComposerComponent);
    fixture.detectChanges();

    fixture.componentInstance['text'].set('Some question');
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('.composer'));
    form.triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();

    expect(fixture.componentInstance['text']()).toBe('');
  });

  it('does not emit when text is blank', () => {
    const fixture = TestBed.createComponent(ComposerComponent);
    fixture.detectChanges();

    const listener = vi.fn();
    fixture.componentInstance.submitted.subscribe(listener);

    fixture.componentInstance['text'].set('   ');
    const form = fixture.debugElement.query(By.css('.composer'));
    form.triggerEventHandler('ngSubmit', null);

    expect(listener).not.toHaveBeenCalled();
  });
});
