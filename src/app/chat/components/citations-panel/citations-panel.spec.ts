import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { CitationsPanelComponent } from './citations-panel';
import type { Citation } from '../../../shared/models';

function makeCitation(overrides: Partial<Citation> = {}): Citation {
  return {
    sourceId: 'src-001',
    title: 'REACH Regulation',
    excerpt: 'REACH is a European Union regulation.',
    location: 'Article 1',
    ...overrides,
  };
}

describe('CitationsPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitationsPanelComponent],
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(CitationsPanelComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows empty placeholder when citations array is empty', () => {
    const fixture = TestBed.createComponent(CitationsPanelComponent);
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('.citations-panel__empty'));
    expect(empty).toBeTruthy();
    expect(empty.nativeElement.textContent).toContain('No sources cited yet');
  });

  it('renders a list item per citation', () => {
    const fixture = TestBed.createComponent(CitationsPanelComponent);
    fixture.componentRef.setInput('citations', [
      makeCitation({ sourceId: 's1', title: 'Doc A' }),
      makeCitation({ sourceId: 's2', title: 'Doc B' }),
    ]);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.css('.citation'));
    expect(items).toHaveLength(2);
  });

  it('displays citation title', () => {
    const fixture = TestBed.createComponent(CitationsPanelComponent);
    fixture.componentRef.setInput('citations', [makeCitation({ title: 'REACH Reg' })]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('REACH Reg');
  });

  it('does not render the list when citations is empty', () => {
    const fixture = TestBed.createComponent(CitationsPanelComponent);
    fixture.detectChanges();

    const list = fixture.debugElement.query(By.css('.citations-panel__list'));
    expect(list).toBeNull();
  });

  it('hides empty placeholder when citations are present', () => {
    const fixture = TestBed.createComponent(CitationsPanelComponent);
    fixture.componentRef.setInput('citations', [makeCitation()]);
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('.citations-panel__empty'));
    expect(empty).toBeNull();
  });
});
