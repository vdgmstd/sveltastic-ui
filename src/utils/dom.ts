export const isBrowser = typeof document !== 'undefined';

/** Node types are out of scope for the kit's tsconfig, so the one member the dev guard reads is declared here. */
declare const process: { env: { NODE_ENV?: string } };

/**
 * Bundlers statically replace the `process.env.NODE_ENV` member expression, so this folds to a constant and
 * tree-shakes away in production; the try/catch covers raw un-bundled ESM where `process` is not defined at all.
 * A bare `typeof process` guard would not fold — bundlers never replace the identifier alone.
 */
let isDev = false;
try {
	isDev = process.env.NODE_ENV !== 'production';
} catch {
	isDev = false;
}

const warned = new Set<string>();

/** Dev-only, de-duplicated misuse warning. Compiles to a no-op guard in production and never fires twice for the same message. */
export function devWarn(message: string): void {
	if (!isDev) return;
	if (warned.has(message)) return;
	warned.add(message);
	console.warn(`[sveltastic-ui] ${message}`);
}
