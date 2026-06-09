import { Tween } from 'svelte/motion';
import { cubicOut, backOut } from 'svelte/easing';

export type PressBounceOptions = {
	/** Scale at the bottom of the dip. Button uses 0.96, Switch 0.88, most others 0.85. */
	dip?: number;
	/** Easing for the recovery phase. `backOut` overshoots (default); Button uses `cubicOut`. */
	out?: typeof cubicOut;
	/** Recovery duration in ms. Default 460; Button uses 260. */
	outDuration?: number;
	/** Resting scale, evaluated per press (Button lifts to 1.06 while hovered). */
	rest?: () => number;
	/** Block the press while disabled/loading. */
	disabled?: () => boolean;
	/** Keys that trigger a keyboard press. Default Enter + Space. */
	keys?: readonly string[];
	/** Fired when the dip starts (host toggles `isPressing` / press-color cues). */
	onstart?: () => void;
	/** Fired when the recovery completes uncancelled (host clears its cues). */
	onsettle?: () => void;
};

const DIP_DURATION = 110;

/** Shared press micro-interaction: rest → dip → rest, token-cancellable so rapid presses don't stack. Bind `scale` to `style:--ps` / `style:--press-scale`. */
export function pressBounce(options: PressBounceOptions = {}) {
	const dip = options.dip ?? 0.85;
	const out = options.out ?? backOut;
	const outDuration = options.outDuration ?? 460;
	const restOf = options.rest ?? (() => 1);
	const isDisabled = options.disabled ?? (() => false);
	const keys = options.keys ?? ['Enter', ' '];

	const tween = new Tween(1, { duration: DIP_DURATION, easing: cubicOut });
	let token = 0;

	async function press(): Promise<void> {
		if (isDisabled()) return;
		const rest = restOf();
		const current = ++token;
		tween.set(rest, { duration: 0 });
		options.onstart?.();
		await tween.set(dip, { duration: DIP_DURATION, easing: cubicOut });
		if (current !== token) return;
		await tween.set(rest, { duration: outDuration, easing: out });
		if (current !== token) return;
		options.onsettle?.();
	}

	function onpointerdown(event: PointerEvent): void {
		if (isDisabled()) return;
		if (event.button !== 0 && event.pointerType === 'mouse') return;
		void press();
	}

	function onkeydown(event: KeyboardEvent): void {
		if (isDisabled()) return;
		if (event.repeat) return;
		if (!keys.includes(event.key)) return;
		void press();
	}

	return {
		get scale(): number {
			return tween.current;
		},
		press,
		onpointerdown,
		onkeydown
	};
}
