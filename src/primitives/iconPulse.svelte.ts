import { Tween } from 'svelte/motion';
import { cubicOut, backOut } from 'svelte/easing';

const FILL_COVER = 2.2;

/** Focus-pulse for a field icon button: a scale pulse on focus-in plus a radial fill blooming from a random point. Shared by Input.Icon and the InputShell primitive. */
export class IconPulseState {
	#node: HTMLElement | undefined;
	#token = 0;
	#prevActive = false;

	readonly ifs = new Tween(0, { duration: 0, easing: cubicOut });
	readonly ifp = new Tween(0, { duration: 450, easing: cubicOut });
	fillX = $state(0);
	fillY = $state(0);
	fillSize = $state(0);

	/** Capture the icon button element so the fill can be measured from it. */
	setNode(node: HTMLElement | undefined): void {
		this.#node = node;
	}

	/** Drive the pulse from the live focused state — call inside an `$effect`. */
	sync(active: boolean): void {
		if (active && !this.#prevActive) {
			void this.#pulse();
			this.#spawnFill();
		} else if (!active && this.#prevActive) {
			this.ifp.target = 0;
		}
		this.#prevActive = active;
	}

	async #pulse(): Promise<void> {
		const token = ++this.#token;
		this.ifs.set(0, { duration: 0 });
		await this.ifs.set(1, { duration: 180, easing: cubicOut });
		if (token !== this.#token) return;
		await this.ifs.set(0, { duration: 480, easing: backOut });
	}

	#spawnFill(): void {
		const node = this.#node;
		if (!node) return;
		const r = node.getBoundingClientRect();
		const x = Math.random() * r.width;
		const y = Math.random() * r.height;
		this.fillX = x;
		this.fillY = y;
		this.fillSize = Math.ceil(
			Math.max(
				Math.hypot(x, y),
				Math.hypot(r.width - x, y),
				Math.hypot(x, r.height - y),
				Math.hypot(r.width - x, r.height - y)
			) * FILL_COVER
		);
		this.ifp.target = 1;
	}

	/** CSS custom-property string for the icon button (consumed by field.css). */
	get style(): string {
		return (
			`--ifs:${this.ifs.current};` +
			`--ifp:${this.ifp.current};` +
			`--icon-fill-x:${this.fillX}px;` +
			`--icon-fill-y:${this.fillY}px;` +
			`--icon-fill-size:${this.fillSize}px;`
		);
	}
}
