<script lang="ts" module>
	let mounted = false;
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		/** Milliseconds of scroll inactivity before the thumb fades out. */
		hideAfter?: number;
		/**
		 * Root to attach the capture-phase scroll listener to. Defaults to
		 * `document`. Override when the host lives inside a shadow root or a
		 * same-origin iframe — mount one ScrollbarHost per scope.
		 */
		target?: Document | ShadowRoot | HTMLElement;
	}

	let { hideAfter = 1000, target }: Props = $props();

	const ATTR = 'data-scrolling';

	onMount(() => {
		if (mounted) return;
		mounted = true;

		const root: Document | ShadowRoot | HTMLElement = target ?? document;
		const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>();
		const tagged = new Set<Element>();

		function onScroll(event: Event): void {
			const eventTarget = event.target;
			const el =
				eventTarget instanceof Document
					? eventTarget.scrollingElement ?? eventTarget.documentElement
					: eventTarget instanceof Element
						? eventTarget
						: null;
			if (!el) return;

			if (!el.hasAttribute(ATTR)) {
				el.setAttribute(ATTR, '');
				tagged.add(el);
			}

			const prev = timers.get(el);
			if (prev !== undefined) clearTimeout(prev);

			const id = setTimeout(() => {
				el.removeAttribute(ATTR);
				timers.delete(el);
				tagged.delete(el);
			}, hideAfter);
			timers.set(el, id);
		}

		root.addEventListener('scroll', onScroll, { capture: true, passive: true });

		return () => {
			root.removeEventListener('scroll', onScroll, { capture: true });
			for (const el of tagged) {
				const id = timers.get(el);
				if (id !== undefined) clearTimeout(id);
				el.removeAttribute(ATTR);
			}
			tagged.clear();
			mounted = false;
		};
	});
</script>
