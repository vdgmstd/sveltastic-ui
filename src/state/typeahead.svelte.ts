export type TypeaheadOptions = {
	/** Ms of inactivity before the search buffer resets. */
	timeout?: number;
};

/** Cycle through candidates whose text starts with `search`, beginning after `from`; repeated single char advances by one. */
function getNextMatch<T>(
	candidates: T[],
	getText: (item: T) => string,
	search: string,
	from: number
): T | undefined {
	const lower = search.toLowerCase();
	const allSame = search.length > 1 && [...search].every((c) => c === search[0]);
	const needle = allSame ? search[0].toLowerCase() : lower;
	const start = allSame || search.length === 1 ? from + 1 : from;
	const len = candidates.length;
	for (let i = 0; i < len; i++) {
		const idx = ((start + i) % len + len) % len;
		if (getText(candidates[idx]).trim().toLowerCase().startsWith(needle)) return candidates[idx];
	}
	return undefined;
}

class Typeahead {
	#search = $state('');
	#timer: number | undefined;
	#timeout: number;

	constructor(timeout = 1000) {
		this.#timeout = timeout;
	}

	#resetSoon(): void {
		if (typeof window === 'undefined') return;
		if (this.#timer !== undefined) clearTimeout(this.#timer);
		this.#timer = window.setTimeout(() => {
			this.#search = '';
			this.#timer = undefined;
		}, this.#timeout);
	}

	/** Append a typed character and return the next matching candidate, or undefined. */
	type<T>(char: string, candidates: T[], getText: (item: T) => string, from: number): T | undefined {
		this.#search += char;
		this.#resetSoon();
		return getNextMatch(candidates, getText, this.#search, from);
	}

	/** Clear the buffer and cancel the pending reset. */
	clear(): void {
		if (this.#timer !== undefined) {
			clearTimeout(this.#timer);
			this.#timer = undefined;
		}
		this.#search = '';
	}

	/** Release the pending timer; call on destroy. */
	destroy(): void {
		if (this.#timer !== undefined) {
			clearTimeout(this.#timer);
			this.#timer = undefined;
		}
	}
}

/** Create a self-resetting type-to-focus search buffer for Menu / Select / Listbox. */
export function createTypeahead(options?: TypeaheadOptions): Typeahead {
	return new Typeahead(options?.timeout);
}

export type { Typeahead };
