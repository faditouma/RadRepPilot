import { describe, expect, it } from 'vitest';
import { calculatorRegistry, publicCalculatorRegistry } from './calculatorRegistry';
import { calculatorNavigationTree, publicCalculatorNavigationTree } from './calculatorNavigationTree';

describe('calculator registry production visibility', () => {
  it('retains unfinished helpers internally while exposing functional helpers only', () => {
    expect(calculatorRegistry.some((helper) => helper.status === 'partial')).toBe(true);
    expect(calculatorRegistry.some((helper) => helper.status === 'placeholder')).toBe(true);
    expect(publicCalculatorRegistry.length).toBeGreaterThan(0);
    expect(publicCalculatorRegistry.every((helper) => helper.status === 'implemented')).toBe(true);
  });

  it('removes empty and unfinished helper families from public navigation', () => {
    const publicIds = new Set(publicCalculatorRegistry.map((helper) => helper.id));
    const internalIds = calculatorNavigationTree.flatMap((category) => category.calculatorIds);
    const visibleIds = publicCalculatorNavigationTree.flatMap((category) => category.calculatorIds);

    expect(visibleIds.every((id) => publicIds.has(id))).toBe(true);
    expect(visibleIds.length).toBeLessThan(internalIds.length);
    expect(publicCalculatorNavigationTree.every((category) => category.calculatorIds.length > 0)).toBe(true);
  });
});
