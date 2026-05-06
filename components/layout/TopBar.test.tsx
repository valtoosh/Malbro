// components/layout/TopBar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the foundation name', () => {
    render(<TopBar />);
    expect(screen.getByText(/The Marlbro Foundation/i)).toBeInTheDocument();
  });

  it('shows a schedule reference', () => {
    render(<TopBar />);
    expect(screen.getByText(/Schedule R-7/i)).toBeInTheDocument();
  });

  it('uses the brand red background', () => {
    render(<TopBar data-testid="topbar" />);
    expect(screen.getByTestId('topbar').className).toMatch(/bg-marlbro/);
  });

  it('accepts an override schedule prop', () => {
    render(<TopBar schedule="Form 999-Z" />);
    expect(screen.getByText(/Form 999-Z/)).toBeInTheDocument();
  });
});
