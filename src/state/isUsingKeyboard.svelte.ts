class KeyboardModality {
	#value = $state(false);
	#refs = 0;
	#cleanup: (() => void) | null = null;

	/** True when the last input was a key press, false after a pointer event. */
	get current(): boolean {
		return this.#value;
	}

	#attach(): void {
		if (typeof document === 'undefined') return;
		const ac = new AbortController();
		document.addEventListener('keydown', () => (this.#value = true), {
			capture: true,
			signal: ac.signal
		});
		document.addEventListener('pointerdown', () => (this.#value = false), {
			capture: true,
			signal: ac.signal
		});
		this.#cleanup = () => ac.abort();
	}

	/** Start observing modality; returns an unsubscribe. Wire as an `$effect` teardown so listeners detach with the consumer. Listeners attach only while ≥1 observer is active. */
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

export const isUsingKeyboard = new KeyboardModality();
