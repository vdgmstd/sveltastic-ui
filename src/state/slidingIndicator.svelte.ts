import { Spring } from 'svelte/motion';

export type SpringConfig = { stiffness: number; damping: number };

export type SlidingIndicatorOptions = {
	/** Spring stiffness/damping for the thumb. */
	spring?: SpringConfig;
};

/**
 * Spring-driven sliding thumb shared by Segmented and Tabs. Tracks an active element's
 * `offsetLeft`/`offsetWidth` (and top/height) within a track; `ready` stays false until the
 * first rAF after a non-zero measure so the thumb never animates from 0 on mount.
 *
 * Invariant: `trackEl` MUST be `activeEl.offsetParent` — coords are offsetParent-relative, so the
 * track needs `position: relative` (TabList `.tab-list` and Segmented `.segmented` both satisfy this).
 */
class SlidingIndicator {
	#x: Spring<number>;
	#y: Spring<number>;
	#w: Spring<number>;
	#h: Spring<number>;
	#ready = $state(false);
	#frame: number | null = null;

	constructor(config: SpringConfig) {
		this.#x = new Spring(0, config);
		this.#y = new Spring(0, config);
		this.#w = new Spring(0, config);
		this.#h = new Spring(0, config);
	}

	get x(): number {
		return this.#x.current;
	}
	get y(): number {
		return this.#y.current;
	}
	get w(): number {
		return this.#w.current;
	}
	get h(): number {
		return this.#h.current;
	}
	get ready(): boolean {
		return this.#ready;
	}

	/** Update the spring stiffness/damping live (Tabs flips between underline and filled feels). */
	setSpring(config: SpringConfig): void {
		this.#x.stiffness = config.stiffness;
		this.#x.damping = config.damping;
		this.#y.stiffness = config.stiffness;
		this.#y.damping = config.damping;
		this.#w.stiffness = config.stiffness;
		this.#w.damping = config.damping;
		this.#h.stiffness = config.stiffness;
		this.#h.damping = config.damping;
	}

	#promote(): void {
		if (this.#ready || this.#w.current <= 0) return;
		if (this.#frame !== null) return;
		this.#frame = requestAnimationFrame(() => {
			this.#frame = null;
			this.#ready = true;
		});
	}

	/** Measure the active element relative to the track; pass `null` to collapse the thumb width. */
	measure(activeEl: HTMLElement | null | undefined, trackEl: HTMLElement | null | undefined): void {
		const opts = this.#ready ? undefined : { instant: true as const };
		if (!activeEl) {
			this.#w.set(0, opts);
			return;
		}
		if (!trackEl) return;
		this.#x.set(activeEl.offsetLeft, opts);
		this.#y.set(activeEl.offsetTop, opts);
		this.#w.set(activeEl.offsetWidth, opts);
		this.#h.set(activeEl.offsetHeight, opts);
		this.#promote();
	}

	/** Observe the track for size changes, re-running `remeasure`; returns a disconnect. */
	observe(trackEl: HTMLElement, remeasure: () => void): () => void {
		const ro = new ResizeObserver(remeasure);
		ro.observe(trackEl);
		return () => ro.disconnect();
	}

	/** Cancel any pending ready-promotion frame; call on destroy. */
	destroy(): void {
		if (this.#frame !== null) {
			cancelAnimationFrame(this.#frame);
			this.#frame = null;
		}
	}
}

/** Create a sliding-indicator engine; defaults to the Segmented spring `{0.18, 0.78}`. */
export function createSlidingIndicator(options?: SlidingIndicatorOptions): SlidingIndicator {
	return new SlidingIndicator(options?.spring ?? { stiffness: 0.18, damping: 0.78 });
}

export type { SlidingIndicator };
