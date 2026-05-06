// lib/tokens.test.ts
import { describe, it, expect } from 'vitest';
import { COLOR, TYPE, SHADOW, BORDER } from './tokens';

describe('design tokens', () => {
  it('exposes the seven brand colors with stable hex values', () => {
    expect(COLOR.paper).toBe('#F4ECD6');
    expect(COLOR.paper2).toBe('#EBDFC0');
    expect(COLOR.ink).toBe('#0A0A0A');
    expect(COLOR.ink2).toBe('#1A1411');
    expect(COLOR.marlbro).toBe('#C2161A');
    expect(COLOR.marlbroDeep).toBe('#8B0E12');
    expect(COLOR.gold).toBe('#C9A227');
    expect(COLOR.stampRed).toBe('#A11C1F');
  });

  it('exposes the type scale in px units', () => {
    expect(TYPE.scale.d1).toBe('96px');
    expect(TYPE.scale.body).toBe('16px');
    expect(TYPE.scale.eyebrow).toBe('10px');
  });

  it('exposes solid offset shadows with no blur', () => {
    expect(SHADOW.sm).toBe('4px 4px 0 #0A0A0A');
    expect(SHADOW.md).toBe('6px 6px 0 #0A0A0A');
    expect(SHADOW.lg).toBe('10px 10px 0 #0A0A0A');
  });

  it('exposes border weights', () => {
    expect(BORDER.default).toBe('2px');
    expect(BORDER.card).toBe('4px');
    expect(BORDER.poster).toBe('6px');
  });
});
