// components/ui/FootnoteList.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FootnoteList } from './FootnoteList';

describe('FootnoteList', () => {
  it('renders a list of disclosures with anchor IDs', () => {
    render(
      <FootnoteList
        items={[
          { n: 1, text: 'First disclosure.' },
          { n: 2, text: 'Second disclosure.' },
        ]}
      />,
    );
    expect(screen.getByText('First disclosure.')).toBeInTheDocument();
    expect(screen.getByText('Second disclosure.')).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(list.querySelector('#fn-1')).not.toBeNull();
    expect(list.querySelector('#fn-2')).not.toBeNull();
  });

  it('shows the "DISCLOSURES" heading', () => {
    render(<FootnoteList items={[{ n: 1, text: 'x' }]} />);
    expect(screen.getByText(/DISCLOSURES/i)).toBeInTheDocument();
  });
});
