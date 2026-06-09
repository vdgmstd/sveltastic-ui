import type { Variant } from '../../types';

export type ChipVariant = Extract<
	Variant,
	'default' | 'flat' | 'border' | 'gradient' | 'transparent' | 'shadow'
>;

export type ChipRootConfig = {
	getDisabled: () => boolean;
};

/** Chip Root state — light shared bag so `Chip.Close` reads `disabled` (gate close) and parts assert they live in a Root. */
export class ChipRootState {
	readonly cfg: ChipRootConfig;
	constructor(cfg: ChipRootConfig) {
		this.cfg = cfg;
	}
	get disabled(): boolean {
		return this.cfg.getDisabled();
	}
}
