class ReducedMotion {
	#value = $state(false);
	#cleanup: (() => void) | null = null;
	#refs = 0;

	/** True when the user requested reduced motion (`prefers-reduced-motion: reduce`). */
	get current(): boolean {
		return this.#value;
	}

	#attach(): void {
		if (typeof window === 'undefined' || !window.matchMedia) return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		this.#value = mq.matches;
		const onChange = (): void => {
			this.#value = mq.matches;
		};
		mq.addEventListener('change', onChange);
		this.#cleanup = () => mq.removeEventListener('change', onChange);
	}

	/** Start observing the media query; returns an unsubscribe. Wire as an `$effect` teardown. */
	subscribe(): () => void {
		if (this.#refs === 0) this.#attach();
		this.#refs += 1;
		let released = false;
		return () => {
			if (released) return;
			released = true;
			this.#refs -= 1;
			if (this.#refs === 0) {
				this.#cleanup?.();
				this.#cleanup = null;
			}
		};
	}
}

export const reducedMotion = new ReducedMotion();
