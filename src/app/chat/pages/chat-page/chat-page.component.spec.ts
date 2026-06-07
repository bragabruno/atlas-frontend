import { TestBed } from '@angular/core/testing';
import { ChatPageComponent } from './chat-page.component';

describe('ChatPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatPageComponent],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(ChatPageComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('starts with an empty messages list', () => {
    const fixture = TestBed.createComponent(ChatPageComponent);
    const component = fixture.componentInstance;
    expect(component.messages()).toEqual([]);
  });

  it('starts with isStreaming false', () => {
    const fixture = TestBed.createComponent(ChatPageComponent);
    const component = fixture.componentInstance;
    expect(component.isStreaming()).toBe(false);
  });
});
