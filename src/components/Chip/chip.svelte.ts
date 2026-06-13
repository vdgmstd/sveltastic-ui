import type { Variant } from '../../types';

export type ChipVariant = Extract<
	Variant,
	'default' | 'flat' | 'border' | 'gradient' | 'transparent' | 'shadow'
>;

export type ChipRootConfig = {
	getDisabled: () => boolean;
	getInteractive: () => boolean;
};

/** Chip Root state — shared bag so `Chip.Close` reads `disabled`/`interactive` and the root can trigger a registered close. */
export class ChipRootState {
	readonly cfg: ChipRootConfig;
	#close: ((event: Event) => void) | undefined;
	constructor(cfg: ChipRootConfig) {
		this.cfg = cfg;
	}
	get disabled(): boolean {
		return this.cfg.getDisabled();
	}
	get isInteractive(): boolean {
		return this.cfg.getInteractive();
	}
	registerClose(fn: (event: Event) => void): () => void {
		this.#close = fn;
		return () => {
			if (this.#close === fn) this.#close = undefined;
		};
	}
	requestClose(event: Event): void {
		this.#close?.(event);
	}
}
