import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import type { EasingFunction } from 'svelte/transition';

export type AnimatedNumberOptions = {
	/** Duration in ms — constant regardless of how far the value moves. */
	duration?: number;
	/** Easing function applied to the tween. */
	easing?: EasingFunction;
};

/**
 * Reactive number that tweens to a target value over a fixed duration.
 * The duration is independent of distance — 0 → 1 takes the same time as 0 → 100.
 * Mutable `duration` / `easing` are picked up on the next `target = …` assignment.
 */
export class AnimatedNumber {
	duration: number;
	easing: EasingFunction;
	#tween: Tween<number>;

	constructor(initial: number, options: AnimatedNumberOptions = {}) {
		this.duration = options.duration ?? 500;
		this.easing = options.easing ?? cubicOut;
		this.#tween = new Tween(initial, { duration: this.duration, easing: this.easing });
	}

	get current(): number {
		return this.#tween.current;
	}

	set target(value: number) {
		this.#tween.set(value, { duration: this.duration, easing: this.easing });
	}

	/** Jump to a value with no animation. */
	snap(value: number): void {
		this.#tween.set(value, { duration: 0 });
	}
}
