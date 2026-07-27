import { describe, expect, it } from 'vitest';
import { publicModuleNavigationTree, moduleNavigationTree } from './moduleNavigationTree';
import { reportingWorkflowSchemas } from './reportingWorkflowSchemas';

const flatten = (tree: typeof moduleNavigationTree) =>
  tree.flatMap((modality) => modality.bodySystems).flatMap((bodySystem) => bodySystem.workflows);

describe('workflow navigation registry reconciliation', () => {
  const internalEntries = flatten(moduleNavigationTree);
  const publicEntries = flatten(publicModuleNavigationTree);

  it('retains definitive internal counts with unique canonical module IDs', () => {
    expect(internalEntries.filter((entry) => entry.status === 'implemented')).toHaveLength(55);
    expect(internalEntries.filter((entry) => entry.status === 'partial')).toHaveLength(15);
    expect(internalEntries.filter((entry) => entry.status === 'planned')).toHaveLength(34);
    expect(new Set(internalEntries.map((entry) => entry.moduleId)).size).toBe(internalEntries.length);
  });

  it('hides every planned workflow from ordinary navigation', () => {
    expect(publicEntries.some((entry) => entry.status === 'planned')).toBe(false);
    expect(publicEntries.some((entry) => entry.moduleId === 'ct-ap-diverticulitis')).toBe(false);
    expect(publicModuleNavigationTree.some((modality) => modality.name === 'Interventional Radiology')).toBe(false);
  });

  it('keeps partial entries explicitly unavailable and implemented entries routable', () => {
    const partialEntries = publicEntries.filter((entry) => entry.status === 'partial');
    expect(partialEntries).toHaveLength(15);
    expect(partialEntries.every((entry) => entry.moduleType === undefined)).toBe(true);

    const implementedEntries = publicEntries.filter((entry) => entry.status === 'implemented');
    expect(implementedEntries.every((entry) => entry.moduleType && reportingWorkflowSchemas[entry.moduleType])).toBe(true);
  });

  it('removes the RUQ collision and preserves distinct modality-specific IDs', () => {
    expect(internalEntries.filter((entry) => entry.moduleId === 'us-ruq-biliary')).toHaveLength(1);
    expect(internalEntries.some((entry) => entry.title === 'Abnormal LFTs / Biliary Dilation')).toBe(false);
    expect(internalEntries.some((entry) => entry.moduleId === 'us-liver-lesion-incidental')).toBe(true);
    expect(internalEntries.some((entry) => entry.moduleId === 'ct-liver-lesion-incidental')).toBe(true);
  });
});
