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
	import type { TransitionConfig } from 'svelte/transition';
	import { backOut, cubicOut, expoOut } from 'svelte/easing';
	import { getDialogCtx } from './context';
	import type { DialogAlign } from './dialog.svelte';
	import { scrollLock } from '../../state/scrollLock.svelte';
	import { portal } from '../../actions/portal';
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
		return scrollLock.lock(dialogEl);
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
	let pointerDownOnBackdrop = false;
	function handlePointerDown(event: PointerEvent): void {
		pointerDownOnBackdrop = event.target === dialogEl;
	}
	function handleBackdrop(event: MouseEvent): void {
		// Close only when both the press and the release land on the backdrop — a text drag that ends on it must not dismiss.
		if (event.target !== dialogEl || !pointerDownOnBackdrop) return;
		pointerDownOnBackdrop = false;
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
		onpointerdown: handlePointerDown,
		onclick: handleBackdrop
	});
	const merged = $derived(mergeProps(rest, attrs, { class: cn('dialog', className) }));

	const isEdge = (a: DialogAlign): boolean => a === 'start' || a === 'end' || a === 'bottom';

	// Edge drawers slide off their anchored edge; direction is inline-axis (RTL-aware) for start/end, block for bottom.
	function edgeSlide(node: HTMLElement, align: DialogAlign, duration: number, easing: (t: number) => number): TransitionConfig {
		const rtl = getComputedStyle(node).direction === 'rtl';
		let tx = 0;
		let ty = 0;
		if (align === 'start') tx = rtl ? node.offsetWidth : -node.offsetWidth;
		else if (align === 'end') tx = rtl ? -node.offsetWidth : node.offsetWidth;
		else ty = node.offsetHeight;
		return {
			duration,
			easing,
			css: (t, u) => `transform: translate3d(${u * tx}px, ${u * ty}px, 0); opacity: ${t};`
		};
	}

	function panelIn(node: HTMLElement, { align }: { align: DialogAlign }): TransitionConfig {
		return isEdge(align)
			? edgeSlide(node, align, 320, expoOut)
			: scale(node, { start: 0.6, opacity: 0.2, duration: 320, easing: backOut });
	}
	function panelOut(node: HTMLElement, { align }: { align: DialogAlign }): TransitionConfig {
		return isEdge(align)
			? edgeSlide(node, align, 200, cubicOut)
			: scale(node, { start: 0.8, opacity: 0, duration: 170, easing: cubicOut });
	}
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
	use:portal={{ target: root.portal.target, disabled: !root.portal.active || root.portal.disabled }}
	style:--c={root.triplet}
>
	{#if root.open}
		<div
			class="dialog__panel"
			role="document"
			tabindex="-1"
			{@attach (n) => void n.focus({ preventScroll: true })}
			style:--rb={root.rebound.current}
			in:panelIn={{ align: root.align }}
			out:panelOut={{ align: root.align }}
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

	.dialog[data-align='start'],
	.dialog[data-align='end'] {
		height: 100vh;
		max-height: 100vh;
		margin-block: 0;
	}
	.dialog[data-align='start'] { margin-inline: 0 auto; }
	.dialog[data-align='end'] { margin-inline: auto 0; }
	.dialog[data-align='bottom'] {
		width: 100%;
		max-width: 100%;
		max-height: 90vh;
		margin-block: auto 0;
		margin-inline: auto;
	}

	.dialog[data-align='start'] .dialog__panel,
	.dialog[data-align='end'] .dialog__panel { height: 100%; }
	.dialog[data-align='start'] .dialog__panel {
		border-start-start-radius: 0;
		border-end-start-radius: 0;
	}
	.dialog[data-align='end'] .dialog__panel {
		border-start-end-radius: 0;
		border-end-end-radius: 0;
	}
	.dialog[data-align='bottom'] .dialog__panel {
		border-end-start-radius: 0;
		border-end-end-radius: 0;
	}

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
