import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MessageComponent } from './message';
import type { Message } from '../../../shared/models';

function makeMsg(overrides: Partial<Message> = {}): Message {
  return {
    id: '1',
    role: 'user',
    content: 'Hello',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('MessageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageComponent],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(MessageComponent);
    fixture.componentRef.setInput('message', makeMsg());
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders message content', () => {
    const fixture = TestBed.createComponent(MessageComponent);
    fixture.componentRef.setInput('message', makeMsg({ content: 'REACH is a regulation' }));
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('REACH is a regulation');
  });

  it('applies message--user class for user role', () => {
    const fixture = TestBed.createComponent(MessageComponent);
    fixture.componentRef.setInput('message', makeMsg({ role: 'user' }));
    fixture.detectChanges();

    const div = fixture.debugElement.query(By.css('.message--user'));
    expect(div).toBeTruthy();
  });

  it('applies message--assistant class for assistant role', () => {
    const fixture = TestBed.createComponent(MessageComponent);
    fixture.componentRef.setInput('message', makeMsg({ role: 'assistant', content: 'answer' }));
    fixture.detectChanges();

    const div = fixture.debugElement.query(By.css('.message--assistant'));
    expect(div).toBeTruthy();
  });

  it('displays the role label', () => {
    const fixture = TestBed.createComponent(MessageComponent);
    fixture.componentRef.setInput('message', makeMsg({ role: 'user' }));
    fixture.detectChanges();

    const span = fixture.debugElement.query(By.css('.message__role'));
    expect(span.nativeElement.textContent.toLowerCase()).toContain('user');
  });
});
