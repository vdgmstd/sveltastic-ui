<script lang="ts">
	import { XIcon } from 'phosphor-svelte';
	import Spinner from '../../primitives/Spinner.svelte';
	import { rgbTriplet } from '../../utils/color';
	import { toaster, type ToastEntry } from '../../state/toast.svelte';
	import { setToastCtx } from './context';

	let { entry, closeLabel }: { entry: ToastEntry; closeLabel: string } = $props();

	const close = (): void => toaster.close(entry.id);

	setToastCtx({
		get entry() {
			return entry;
		},
		get closeLabel() {
			return closeLabel;
		},
		close
	});

	let interactive = $derived(!!entry.onclick || !!entry.clickClose);
	let assertive = $derived(entry.color === 'danger' || entry.color === 'warning');
	let triplet = $derived(rgbTriplet(entry.color ?? 'primary'));
	let body = $derived(entry.description ?? entry.text);

	function handleBodyClick(): void {
		entry.onclick?.();
		if (entry.clickClose) close();
	}
</script>

{#if entry.content}
	{@render entry.content({ toast: entry, close })}
{:else}
	<div
		class="toast"
		class:toast--border={entry.border}
		class:toast--square={entry.square}
		class:toast--interactive={interactive}
		style:--c={triplet}
		data-toast=""
		data-color={entry.color ?? 'primary'}
		role={assertive ? 'alert' : 'status'}
		aria-live={assertive ? 'assertive' : 'polite'}
	>
		{#if interactive}
			<button type="button" class="toast__action" onclick={handleBodyClick}>
				{#if entry.loading}
					<span class="toast__spinner" aria-hidden="true">
						<Spinner color={entry.color ?? 'primary'} size={20} thickness={2.4} speed={800} />
					</span>
				{:else if entry.icon}
					<span class="toast__icon" aria-hidden="true">{@render entry.icon()}</span>
				{/if}
				<span class="toast__body">
					{#if entry.title}<span class="toast__title">{entry.title}</span>{/if}
					{#if body}<span class="toast__text">{body}</span>{/if}
				</span>
			</button>
		{:else}
			{#if entry.loading}
				<div class="toast__spinner" aria-hidden="true">
					<Spinner color={entry.color ?? 'primary'} size={20} thickness={2.4} speed={800} />
				</div>
			{:else if entry.icon}
				<div class="toast__icon" aria-hidden="true">{@render entry.icon()}</div>
			{/if}
			<div class="toast__body">
				{#if entry.title}<h4 class="toast__title">{entry.title}</h4>{/if}
				{#if body}<p class="toast__text">{body}</p>{/if}
			</div>
		{/if}
		{#if entry.closable}
			<button
				type="button"
				class="toast__close"
				aria-label={entry.closeLabel ?? closeLabel}
				onclick={(e) => {
					e.stopPropagation();
					close();
				}}
			>
				<XIcon size={14} weight="bold" />
			</button>
		{/if}
	</div>
{/if}
