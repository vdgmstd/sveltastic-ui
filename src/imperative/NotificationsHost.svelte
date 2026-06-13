<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { XIcon } from 'phosphor-svelte';
	import { notifications, type NotificationEntry, type NotificationPosition } from './notifications.svelte';
	import { rgbTriplet } from '../utils/color';
	import { portal } from '../actions/portal';
	import Spinner from '../primitives/Spinner.svelte';

	let { closeLabel = 'Close' }: { closeLabel?: string } = $props();

	const POSITIONS: NotificationPosition[] = [
		'top-right',
		'top-left',
		'top-center',
		'bottom-right',
		'bottom-left',
		'bottom-center'
	];

	function group(position: NotificationPosition): NotificationEntry[] {
		return notifications.entries.filter((e) => (e.position ?? 'top-right') === position);
	}

	function flyParams(position: NotificationPosition): { x?: number; y?: number; duration: number } {
		if (position.startsWith('top')) return { y: -16, duration: 200 };
		if (position.startsWith('bottom')) return { y: 16, duration: 200 };
		return { duration: 200 };
	}

	function isAssertive(entry: NotificationEntry): boolean {
		return entry.color === 'danger' || entry.color === 'warning';
	}

	const timers = new Map<number, number>();
	const DEFAULT_DURATION = 5000;

	$effect(() => {
		const liveIds = new Set<number>();
		for (const entry of notifications.entries) {
			liveIds.add(entry.id);
			if (entry.sticky || entry.loading || timers.has(entry.id)) continue;
			const t = window.setTimeout(
				() => notifications.close(entry.id),
				entry.duration ?? DEFAULT_DURATION
			);
			timers.set(entry.id, t);
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
	{@const items = group(position)}
	{#if items.length > 0}
		<div class="notif-stack notif-stack--{position}" use:portal transition:fade={{ duration: 100 }}>
			{#each items as entry (entry.id)}
				{@const interactive = !!entry.onclick || !!entry.clickClose}
				<div
					class="notif"
					class:notif--border={entry.border}
					class:notif--square={entry.square}
					class:notif--interactive={interactive}
					style:--c={rgbTriplet(entry.color ?? 'primary')}
					role={isAssertive(entry) ? 'alert' : 'status'}
					aria-live={isAssertive(entry) ? 'assertive' : 'polite'}
					transition:fly={flyParams(position)}
				>
					{#if interactive}
						<button
							type="button"
							class="notif__action"
							onclick={() => {
								entry.onclick?.();
								if (entry.clickClose) notifications.close(entry.id);
							}}
						>
							{#if entry.loading}
								<span class="notif__spinner" aria-hidden="true">
									<Spinner color={entry.color ?? 'primary'} size={20} thickness={2.4} speed={800} />
								</span>
							{:else if entry.icon}
								<span class="notif__icon" aria-hidden="true">{@render entry.icon()}</span>
							{/if}
							<span class="notif__body">
								{#if entry.title}<span class="notif__title">{entry.title}</span>{/if}
								{#if entry.text}<span class="notif__text">{entry.text}</span>{/if}
							</span>
						</button>
					{:else}
						{#if entry.loading}
							<div class="notif__spinner" aria-hidden="true">
								<Spinner color={entry.color ?? 'primary'} size={20} thickness={2.4} speed={800} />
							</div>
						{:else if entry.icon}
							<div class="notif__icon" aria-hidden="true">{@render entry.icon()}</div>
						{/if}
						<div class="notif__body">
							{#if entry.title}<h4 class="notif__title">{entry.title}</h4>{/if}
							{#if entry.text}<p class="notif__text">{entry.text}</p>{/if}
						</div>
					{/if}
					{#if entry.closable}
						<button
							type="button"
							class="notif__close"
							aria-label={entry.closeLabel ?? closeLabel}
							onclick={(e) => {
								e.stopPropagation();
								notifications.close(entry.id);
							}}
						>
							<XIcon size={14} weight="bold" />
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/each}

<style>
	.notif-stack {
		position: fixed;
		z-index: 99000;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 16px;
		max-width: min(420px, 90vw);
	}
	.notif-stack--top-right { top: 0; right: 0; }
	.notif-stack--top-left { top: 0; left: 0; }
	.notif-stack--top-center { top: 0; left: 50%; transform: translateX(-50%); }
	.notif-stack--bottom-right { bottom: 0; right: 0; }
	.notif-stack--bottom-left { bottom: 0; left: 0; }
	.notif-stack--bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); }

	.notif {
		--c: var(--primary);
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 14px 16px;
		background: rgb(var(--c) / 0.12);
		color: rgb(var(--c));
		border-radius: 12px;
		box-shadow: 0 8px 30px -10px rgb(0 0 0 / 0.2);
		font-size: 0.9rem;
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
		transition: transform 150ms ease, box-shadow 150ms ease;
	}
	.notif--border {
		background: rgb(var(--background) / 0.7);
		border: 2px solid rgb(var(--c));
	}
	.notif--square { border-radius: 0; }
	.notif--interactive {
		padding: 0;
		gap: 0;
	}
	.notif--interactive:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 36px -10px rgb(0 0 0 / 0.28);
	}
	.notif--interactive .notif__close {
		margin-block: 14px;
		margin-inline-end: 16px;
		margin-inline-start: 0;
	}
	.notif__action {
		flex: 1 1 auto;
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 14px 16px;
		background: transparent;
		border: 0;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: pointer;
		border-radius: inherit;
		-webkit-user-select: none;
		user-select: none;
	}
	.notif__action:focus-visible {
		outline: 2px solid rgb(var(--c));
		outline-offset: -2px;
	}
	.notif__icon,
	.notif__spinner {
		flex: 0 0 24px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
	}
	.notif__body {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.notif__title { margin: 0; font-size: 0.95rem; font-weight: 600; line-height: 1.3; }
	.notif__text { margin: 0; font-size: 0.85rem; opacity: 0.9; word-wrap: break-word; line-height: 1.4; }
	.notif__close {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: 0;
		border-radius: 6px;
		color: inherit;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 150ms ease, background-color 150ms ease;
		-webkit-user-select: none;
		user-select: none;
	}
	.notif__close:hover {
		opacity: 1;
		background: rgb(var(--c) / 0.1);
	}
	.notif__close:focus-visible {
		outline: 2px solid rgb(var(--c));
		outline-offset: 1px;
		opacity: 1;
	}
</style>
