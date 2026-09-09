import type { PostgresAdapter } from '../types';
type RequireDrizzleKit = () => {
    generateDrizzleJson: (args: {
        schema: Record<string, unknown>;
    }) => unknown;
    pushSchema: (schema: Record<string, unknown>, drizzle: PostgresAdapter['drizzle'], filterSchema?: string[]) => Promise<{
        apply: any;
        hasDataLoss: any;
        warnings: any;
    }>;
};
export declare const requireDrizzleKit: RequireDrizzleKit;
export {};
//# sourceMappingURL=requireDrizzleKit.d.ts.map