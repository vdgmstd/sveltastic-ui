<script lang="ts" module>
	import '../../styles/toast.css';

	export type ToastProviderProps = {
		/** Default accessible label for the close button. */
		closeLabel?: string;
	};
</script>

<script lang="ts">
	import { fly } from 'svelte/transition';
	import { SvelteSet } from 'svelte/reactivity';
	import { toaster, type ToastEntry, type ToastPosition } from '../../state/toast.svelte';
	import { portal } from '../../actions/portal';
	import ToastItem from './ToastItem.svelte';

	let { closeLabel = 'Close' }: ToastProviderProps = $props();

	const POSITIONS: ToastPosition[] = [
		'top-right',
		'top-left',
		'top-center',
		'bottom-right',
		'bottom-left',
		'bottom-center'
	];

	const DEFAULT_DURATION = 5000;
	const timers = new Map<number, number>();
	const paused = new SvelteSet<ToastPosition>();

	function group(position: ToastPosition): ToastEntry[] {
		return toaster.entries.filter((e) => (e.position ?? 'top-right') === position);
	}

	function flyParams(position: ToastPosition): { x?: number; y?: number; duration: number } {
		if (position.startsWith('top')) return { y: -16, duration: 200 };
		if (position.startsWith('bottom')) return { y: 16, duration: 200 };
		return { duration: 200 };
	}

	$effect(() => {
		const liveIds = new Set<number>();
		for (const entry of toaster.entries) {
			liveIds.add(entry.id);
			const isPaused = paused.has(entry.position ?? 'top-right');
			const shouldRun = !entry.sticky && !entry.loading && !isPaused;
			if (shouldRun && !timers.has(entry.id)) {
				const t = window.setTimeout(
					() => toaster.close(entry.id),
					entry.duration ?? DEFAULT_DURATION
				);
				timers.set(entry.id, t);
			} else if (!shouldRun && timers.has(entry.id)) {
				window.clearTimeout(timers.get(entry.id));
				timers.delete(entry.id);
			}
		}
		for (const [id, t] of timers) {
			if (!liveIds.has(id)) {
				window.clearTimeout(t);
				timers.delete(id);
			}
		}
	});

	$effect(() => () => {
		for (const t of timers.values()) window.clearTimeout(t);
		timers.clear();
	});
</script>

{#each POSITIONS as position (position)}
	<div
		class="toast-stack toast-stack--{position}"
		role="group"
		aria-label="Notifications"
		use:portal
		onpointerenter={() => paused.add(position)}
		onpointerleave={() => paused.delete(position)}
	>
		{#each group(position) as entry (entry.id)}
			<div class="toast-item" transition:fly={flyParams(position)}>
				<ToastItem {entry} {closeLabel} />
			</div>
		{/each}
	</div>
{/each}
