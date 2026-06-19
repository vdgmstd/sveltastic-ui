import { type Snippet } from 'svelte';
import type { PortalTarget } from '../../actions/portal';

/** Config the Root hands the state — getters keep derived chains live, the setter proxies the bindable `open`. */
export type PopoverConfig = {
	getOpen: () => boolean;
	setOpenProp: (open: boolean) => void;
	readonly disabled: boolean;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
};

/** Root state for the Popover compound: the open funnel + the channels each part registers into (mirrors MenuRootState without the roving/typeahead engine). */
export class PopoverRootState {
	#cfg: PopoverConfig;

	/** Set by `Popover.Trigger`; rendered by the engine's `trigger` snippet with the ARIA bag. */
	triggerSnippet = $state<Snippet<[{ props: Record<string, unknown>; open: boolean }]> | undefined>(
		undefined
	);
	/** Set by `Popover.Content`; rendered as the engine's panel body. */
	contentSnippet = $state<Snippet<[() => void]> | undefined>(undefined);
	/** Rest-props (class, style, data and aria attributes) `Popover.Content` forwards onto the panel body. */
	contentProps = $state<Record<string, unknown>>({});
	/** `Popover.Content`'s render-delegation snippet, applied to the panel body by the engine. */
	contentChild = $state<Snippet<[{ props: Record<string, unknown>; body: Snippet }]> | undefined>(
		undefined
	);
	/** Writes the rendered panel-body node back into `Popover.Content`'s bindable `ref`. */
	setContentRef = $state<((node: HTMLElement | null) => void) | undefined>(undefined);
	/** Set by an optional `Popover.Portal`; consumed by the engine that renders the panel. */
	portal = $state<{ target?: PortalTarget; disabled?: boolean; forceMount?: boolean }>({});

	constructor(cfg: PopoverConfig) {
		this.#cfg = cfg;
	}

	get open(): boolean {
		return this.#cfg.getOpen();
	}
	get disabled(): boolean {
		return this.#cfg.disabled;
	}

	/** Single open funnel: write the prop, fire onOpenChange once. */
	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.#cfg.setOpenProp(next);
		this.#cfg.onOpenChange?.(next);
	}

	close = (): void => this.setOpen(false);

	completeOpenChange(open: boolean): void {
		this.#cfg.onOpenChangeComplete?.(open);
	}
}
