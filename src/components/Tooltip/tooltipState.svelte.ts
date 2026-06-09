import { rgbTriplet } from '../../utils/color';
import type { Color } from '../../types';
import type { TooltipPlacement, TooltipTrigger } from './context';

export type TooltipConfig = {
	/** Read the bindable `open` prop (controlled/uncontrolled both flow through it). */
	getOpen: () => boolean;
	/** Write the bindable `open` prop. */
	setOpenProp: (open: boolean) => void;
	readonly placement: TooltipPlacement;
	readonly trigger: TooltipTrigger;
	readonly delay: number;
	readonly interactive: boolean;
	readonly color: Color;
	onOpenChange?: (open: boolean) => void;
	onOpenChangeComplete?: (open: boolean) => void;
};

/** Shared Tooltip state: open (proxied to the bindable prop), the hover-intent timer, the anchor ref + ARIA id. */
export class TooltipRootState {
	/** Anchor used by `computeSidePosition` + `dismissibleLayer.anchor`; written by the Trigger. */
	triggerRef = $state<HTMLElement | null>(null);
	/** ARIA id linking the focusable trigger child to the live bubble. */
	bubbleId = $state<string | undefined>(undefined);
	pointerOnBubble = $state(false);

	private timer: number | undefined;

	constructor(private readonly cfg: TooltipConfig) {}

	get open(): boolean {
		return this.cfg.getOpen();
	}
	get placement(): TooltipPlacement {
		return this.cfg.placement;
	}
	get trigger(): TooltipTrigger {
		return this.cfg.trigger;
	}
	get interactive(): boolean {
		return this.cfg.interactive;
	}
	get color(): Color {
		return this.cfg.color;
	}
	get triplet(): string {
		return rgbTriplet(this.cfg.color);
	}

	setOpen(next: boolean): void {
		if (this.open === next) return;
		this.cfg.setOpenProp(next);
		this.cfg.onOpenChange?.(next);
	}

	completeClose(): void {
		this.cfg.onOpenChangeComplete?.(false);
	}

	clearTimer(): void {
		if (this.timer === undefined) return;
		window.clearTimeout(this.timer);
		this.timer = undefined;
	}

	private show(): void {
		this.clearTimer();
		if (this.cfg.delay > 0) {
			this.timer = window.setTimeout(() => {
				this.setOpen(true);
				this.timer = undefined;
			}, this.cfg.delay);
		} else {
			this.setOpen(true);
		}
	}

	private hide(): void {
		this.clearTimer();
		if (this.cfg.interactive) {
			this.timer = window.setTimeout(() => {
				if (!this.pointerOnBubble) this.setOpen(false);
				this.timer = undefined;
			}, 150);
		} else {
			this.setOpen(false);
		}
	}

	handleEnter = (): void => {
		if (this.cfg.trigger === 'hover') this.show();
	};
	handleLeave = (): void => {
		if (this.cfg.trigger === 'hover') this.hide();
	};
	handleClick = (): void => {
		if (this.cfg.trigger === 'click') this.setOpen(!this.open);
	};

	bubbleEnter = (): void => {
		this.pointerOnBubble = true;
		this.clearTimer();
	};
	bubbleLeave = (): void => {
		this.pointerOnBubble = false;
		if (this.cfg.trigger === 'hover') this.hide();
	};
}
