import type {
	SeparatorOrientation,
	SeparatorVariant,
	SeparatorLabelPlacement
} from '../../primitives/Separator.svelte';

export type DividerOrientation = SeparatorOrientation;
export type DividerVariant = SeparatorVariant;
export type DividerLabelPlacement = SeparatorLabelPlacement;

export interface DividerRootConfig {
	getLabelId: () => string;
}

/** Divider Root state — shared config the `Line`/`Label` parts read for styling and ARIA wiring. */
export class DividerRootState {
	readonly cfg: DividerRootConfig;

	constructor(cfg: DividerRootConfig) {
		this.cfg = cfg;
	}

	get labelId(): string {
		return this.cfg.getLabelId();
	}
}
