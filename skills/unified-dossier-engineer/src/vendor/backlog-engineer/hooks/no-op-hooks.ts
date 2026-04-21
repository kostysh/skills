import type { HookRegistry } from './types.ts';

export function createNoOpRegistry(): HookRegistry {
  return {
    beforeCommand() {
      return Promise.resolve();
    },
    afterCommand() {
      return Promise.resolve();
    },
    afterSourceRegistered() {
      return Promise.resolve();
    },
    afterPacketApplied() {
      return Promise.resolve();
    },
    afterPatchApplied() {
      return Promise.resolve();
    },
    afterRefresh() {
      return Promise.resolve();
    },
    buildSystemSummary() {
      return Promise.resolve([]);
    },
    decorateReportSections({ sections }) {
      return Promise.resolve(sections);
    },
  };
}
