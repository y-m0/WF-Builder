import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('should handle conditional classes correctly with clsx behavior', () => {
    expect(cn('base', { 'conditional-class': true, 'another-class': false })).toBe('base conditional-class');
  });

  it('should override conflicting classes with tailwind-merge behavior', () => {
    // Example: p-2 should override p-4 if p-2 comes later or due to tailwind-merge logic
    // exact behavior might depend on tailwind-merge's specific conflict resolution
    expect(cn('p-4', 'p-2')).toBe('p-2'); // typical tailwind-merge behavior
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500'); // last one wins for conflicting props
  });

  it('should return an empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle various input types', () => {
    expect(cn('foo', ['bar', { baz: true }], null, undefined, 'qux')).toBe('foo bar baz qux');
  });
});
