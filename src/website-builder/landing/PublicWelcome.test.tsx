import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PublicWelcome from './PublicWelcome';

afterEach(() => cleanup());

describe('PublicWelcome', () => {
  it('renders the unpublished public landing, not the owner dashboard', () => {
    render(<PublicWelcome onNext={() => {}} />);
    expect(screen.getByText(/Create Your Salon Website/i)).toBeTruthy();
    expect(screen.getByText(/Start Onboarding Wizard/i)).toBeTruthy();
    expect(screen.queryByText(/Premium Dashboard/i)).toBeNull();
    expect(screen.queryByText(/Payments Ledgers/i)).toBeNull();
  });

  it('starts the onboarding wizard from the public CTA', () => {
    const onNext = vi.fn();
    render(<PublicWelcome onNext={onNext} />);
    fireEvent.click(screen.getByRole('button', { name: /Start Onboarding Wizard/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
