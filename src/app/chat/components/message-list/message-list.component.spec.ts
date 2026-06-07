import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MessageListComponent } from './message-list.component';
import type { Message } from '../../../shared/models';

function makeMsg(id: string, role: 'user' | 'assistant', content: string): Message {
  return { id, role, content, createdAt: '2024-01-01T00:00:00Z' };
}

describe('MessageListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageListComponent],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(MessageListComponent);
    fixture.componentRef.setInput('messages', []);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows empty state when no messages and no streaming content', () => {
    const fixture = TestBed.createComponent(MessageListComponent);
    fixture.componentRef.setInput('messages', []);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ask a regulatory question');
  });

  it('renders one atlas-message per message', () => {
    const fixture = TestBed.createComponent(MessageListComponent);
    fixture.componentRef.setInput('messages', [
      makeMsg('1', 'user', 'Q1'),
      makeMsg('2', 'assistant', 'A1'),
    ]);
    fixture.detectChanges();

    const msgs = fixture.debugElement.queryAll(By.css('atlas-message'));
    expect(msgs).toHaveLength(2);
  });

  it('shows streaming content while streamingContent is non-empty', () => {
    const fixture = TestBed.createComponent(MessageListComponent);
    fixture.componentRef.setInput('messages', [makeMsg('1', 'user', 'Q1')]);
    fixture.componentRef.setInput('streamingContent', 'Partial answer...');
    fixture.detectChanges();

    const streamingEl = fixture.debugElement.query(By.css('.message--streaming'));
    expect(streamingEl).toBeTruthy();
    expect(streamingEl.nativeElement.textContent).toContain('Partial answer...');
  });

  it('hides streaming bubble when streamingContent is empty', () => {
    const fixture = TestBed.createComponent(MessageListComponent);
    fixture.componentRef.setInput('messages', []);
    fixture.componentRef.setInput('streamingContent', '');
    fixture.detectChanges();

    const streamingEl = fixture.debugElement.query(By.css('.message--streaming'));
    expect(streamingEl).toBeNull();
  });
});
