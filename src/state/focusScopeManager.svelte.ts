export type FocusScope = { id: string };

/** Singleton stack of active focus scopes — only the topmost traps, so nested overlays don't fight. */
class FocusScopeManager {
	#stack: FocusScope[] = [];

	register(scope: FocusScope): void {
		this.#stack.push(scope);
	}

	deregister(scope: FocusScope): void {
		const i = this.#stack.indexOf(scope);
		if (i >= 0) this.#stack.splice(i, 1);
	}

	/** True when `scope` is the most recently registered (topmost) live scope. */
	isTopmost(scope: FocusScope): boolean {
		return this.#stack[this.#stack.length - 1] === scope;
	}
}

export const focusScopeManager = new FocusScopeManager();
