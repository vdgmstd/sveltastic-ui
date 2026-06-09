<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';
	import type { WithElementRef } from '../../types';

	export type DialogContentProps = WithElementRef<
		Omit<HTMLDialogAttributes, 'open' | 'children'> & { children?: Snippet },
		HTMLDialogElement
	>;
</script>

<script lang="ts">
	import { scale } from 'svelte/transition';
	import { backOut, cubicOut } from 'svelte/easing';
	import { getDialogCtx } from './context';
	import { scrollLock } from '../../state/scrollLock.svelte';
	import { mergeProps } from '../../utils/mergeProps';
	import { dataState } from '../../utils/attrs';
	import { cn } from '../../utils/cn';

	let { ref = $bindable(null), class: className, children, ...rest }: DialogContentProps = $props();
	const root = getDialogCtx();
	const uid = $props.id();
	const contentId = `dialog-content-${uid}`;
	root.contentId = contentId;

	let dialogEl: HTMLDialogElement | undefined = $state();
	let closeFallback: number | undefined;

	function closeNative(): void {
		if (closeFallback) {
			clearTimeout(closeFallback);
			closeFallback = undefined;
		}
		if (dialogEl?.open) dialogEl.close();
	}

	// Native open/close from root.open; outro closes via onoutroend, the fallback guarantees close if it never fires.
	$effect(() => {
		if (!dialogEl) return;
		if (root.open) {
			if (closeFallback) {
				clearTimeout(closeFallback);
				closeFallback = undefined;
			}
			if (!dialogEl.open) {
				try {
					dialogEl.showModal();
				} catch {
					/* already open or detached */
				}
			}
		} else if (dialogEl.open && closeFallback === undefined) {
			// One-shot, not cleared on re-run: a spurious WebKit re-run must not perpetually defer the close.
			const el = dialogEl;
			closeFallback = window.setTimeout(() => {
				closeFallback = undefined;
				if (el.open) el.close();
			}, 260);
		}
	});
	$effect(() => () => {
		if (closeFallback) {
			clearTimeout(closeFallback);
			closeFallback = undefined;
		}
	});

	$effect(() => {
		if (!root.open) return;
		return scrollLock.lock();
	});

	function handleCancel(event: Event): void {
		event.preventDefault();
		if (root.persistent) {
			root.pulse();
			return;
		}
		root.setOpen(false);
	}
	function handleClose(): void {
		if (root.open) root.setOpen(false);
	}
	function handleBackdrop(event: MouseEvent): void {
		if (event.target !== dialogEl) return;
		if (root.persistent) {
			root.pulse();
			return;
		}
		root.setOpen(false);
	}
	function onExit(): void {
		closeNative();
		root.completeClose();
	}

	const attrs = $derived({
		id: contentId,
		role: root.role,
		'aria-modal': 'true' as const,
		'aria-labelledby': root.titleId,
		'aria-describedby': root.descriptionId,
		'aria-label': root.titleId ? undefined : root.ariaLabel,
		'data-state': dataState(root.open ? 'open' : 'closed'),
		'data-size': root.size,
		'data-align': root.align,
		oncancel: handleCancel,
		onclose: handleClose,
		onclick: handleBackdrop
	});
	const merged = $derived(mergeProps(rest, attrs, { class: cn('dialog', className) }));
</script>

<dialog
	{...merged}
	{@attach (node) => {
		dialogEl = node as HTMLDialogElement;
		ref = node as HTMLDialogElement;
		return () => {
			dialogEl = undefined;
			ref = null;
		};
	}}
	style:--c={root.triplet}
>
	{#if root.open}
		<div
			class="dialog__panel"
			role="document"
			tabindex="-1"
			{@attach (n) => void n.focus({ preventScroll: true })}
			style:--rb={root.rebound.current}
			in:scale={{ start: 0.6, opacity: 0.2, duration: 320, easing: backOut }}
			out:scale={{ start: 0.8, opacity: 0, duration: 170, easing: cubicOut }}
			onoutroend={onExit}
		>
			{@render children?.()}
		</div>
	{/if}
</dialog>

<style>
	:where(.dialog) {
		--c: var(--primary);
		--w: 520px;

		width: min(var(--w), 92vw);
		max-width: 92vw;
		max-height: 90vh;
		padding: 0;
		margin: auto;
		border: 0;
		background: transparent;
		color: rgb(var(--text));
		overflow: visible;
	}

	.dialog::backdrop {
		background: rgb(0 0 0 / 0);
		-webkit-backdrop-filter: blur(0);
		backdrop-filter: blur(0);
		transition:
			background 190ms var(--ease-standard),
			-webkit-backdrop-filter 190ms var(--ease-standard),
			backdrop-filter 190ms var(--ease-standard);
	}
	.dialog[open]::backdrop {
		background: rgb(0 0 0 / 0.45);
		-webkit-backdrop-filter: var(--frost);
		backdrop-filter: var(--frost);
	}
	@starting-style {
		.dialog[open]::backdrop {
			background: rgb(0 0 0 / 0);
			-webkit-backdrop-filter: blur(0);
			backdrop-filter: blur(0);
		}
	}

	.dialog :global(::selection) { background: rgb(var(--c) / 0.18); }
	.dialog:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.45);
		outline-offset: -2px;
	}

	:where(.dialog[data-size='small']) { --w: 400px; }
	:where(.dialog[data-size='medium']) { --w: 520px; }
	:where(.dialog[data-size='large']) { --w: 720px; }
	:where(.dialog[data-size='fullscreen']) {
		width: 100vw;
		height: 100vh;
		max-width: 100vw;
		max-height: 100vh;
	}
	.dialog[data-size='fullscreen'] .dialog__panel {
		border-radius: 0;
	}

	:where(.dialog[data-align='top']) { margin-top: 6vh; margin-bottom: auto; }
	:where(.dialog[data-size='fullscreen'][data-align='top']) { margin: 0; }

	.dialog__panel {
		display: flex;
		flex-direction: column;
		min-height: 0;
		max-height: inherit;
		background: rgb(var(--gray-1));
		border-radius: var(--rad-xl);
		box-shadow: 0 30px 80px -20px rgb(0 0 0 / 0.45);
		overflow: hidden;
		font-size: var(--fs-md);
		transform: scale(var(--rb, 1));
		transform-origin: center;
	}
</style>
