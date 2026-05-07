// components/ui/DisclosureList.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisclosureList } from './DisclosureList';

describe('DisclosureList', () => {
  it('renders each item as a details element', () => {
    render(
      <DisclosureList
        items={[
          { question: 'Q1', answer: 'A1' },
          { question: 'Q2', answer: 'A2' },
        ]}
      />,
    );
    expect(screen.getAllByRole('group')).toHaveLength(2);
  });

  it('renders question as the summary', () => {
    render(<DisclosureList items={[{ question: 'What?', answer: 'Yes.' }]} />);
    expect(screen.getByText('What?')).toBeInTheDocument();
  });

  it('renders answer in the body', () => {
    render(<DisclosureList items={[{ question: 'Q', answer: 'Specific answer.' }]} />);
    expect(screen.getByText('Specific answer.')).toBeInTheDocument();
  });

  it('opens by default when defaultOpen is true', () => {
    const { container } = render(
      <DisclosureList defaultOpen items={[{ question: 'Q', answer: 'A' }]} />,
    );
    const details = container.querySelector('details')!;
    expect(details.hasAttribute('open')).toBe(true);
  });
});
