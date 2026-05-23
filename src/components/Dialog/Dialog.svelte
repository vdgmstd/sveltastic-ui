<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';
	import type { Color } from '../../types';

	export type DialogSize = 'small' | 'medium' | 'large' | 'fullscreen';
	export type DialogAlign = 'center' | 'top';

	export type DialogProps = {
		/** Open state. Two-way bindable. */
		open?: boolean;
		/** Render the top-right close button. */
		closable?: boolean;
		/** Block Esc and backdrop-click close paths. The explicit close button (or consumer action) is the only way out. */
		persistent?: boolean;
		/** Preset width. `'fullscreen'` stretches to the viewport. */
		size?: DialogSize;
		/** Vertical alignment. `'top'` pins the dialog 6vh from the top. */
		align?: DialogAlign;
		/** Accent palette — drives focus outline and selection tint. */
		color?: Color;
		/** Sticky header strip. Provides the accessible name via `aria-labelledby`. */
		header?: Snippet;
		/** Dialog body. */
		children?: Snippet;
		/** Sticky footer strip — typical place for action buttons. */
		footer?: Snippet;
		/** Fires when the dialog closes (any reason). */
		onclose?: () => void;
	} & Omit<HTMLDialogAttributes, 'open' | 'children'>;
</script>

<script lang="ts">
	import { Spring } from 'svelte/motion';
	import { scale } from 'svelte/transition';
	import { backOut, cubicOut } from 'svelte/easing';
	import { XIcon } from 'phosphor-svelte';
	import { rgbTriplet } from '../../utils/color';
	import { cn } from '../../utils/cn';
	import { nextId } from '../../state/ids.svelte';

	let {
		open = $bindable(false),
		closable = true,
		persistent = false,
		size = 'medium',
		align = 'center',
		color = 'primary',
		header,
		children,
		footer,
		onclose,
		class: className,
		style: userStyle,
		...rest
	}: DialogProps = $props();

	const titleId = nextId('dialog-title');
	let triplet = $derived(rgbTriplet(color));
	let dialogEl: HTMLDialogElement | undefined = $state();
	const rebound = new Spring(1, { stiffness: 0.35, damping: 0.45 });

	function pulse(): void {
		rebound.set(1.03, { instant: true });
		rebound.target = 1;
	}

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) dialogEl.showModal();
	});

	function closeNative(): void {
		if (dialogEl?.open) dialogEl.close();
	}

	$effect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	function handleCancel(event: Event): void {
		event.preventDefault();
		if (persistent) {
			pulse();
			return;
		}
		open = false;
	}

	function handleClose(): void {
		if (open) {
			open = false;
			onclose?.();
		}
	}

	function handleBackdrop(event: MouseEvent): void {
		if (event.target !== dialogEl) return;
		if (persistent) {
			pulse();
			return;
		}
		open = false;
	}
</script>

<dialog
	bind:this={dialogEl}
	class={cn('dialog', `dialog--${size}`, `dialog--align-${align}`, className)}
	style:--c={triplet}
	style={userStyle}
	aria-labelledby={header ? titleId : undefined}
	oncancel={handleCancel}
	onclose={handleClose}
	onclick={handleBackdrop}
	{...rest}
>
	{#if open}
		<div
			class="dialog__panel"
			role="document"
			style:--rb={rebound.current}
			in:scale={{ start: 0.6, opacity: 0.2, duration: 320, easing: backOut }}
			out:scale={{ start: 0.8, opacity: 0, duration: 170, easing: cubicOut }}
			onoutroend={closeNative}
		>
			{#if closable}
				<button
					type="button"
					class="dialog__close"
					aria-label="Close dialog"
					onclick={() => (open = false)}
				>
					<XIcon size={16} weight="bold" />
				</button>
			{/if}
			{#if header}
				<header class="dialog__header" id={titleId}>{@render header()}</header>
			{/if}
			<div class="dialog__body">
				{@render children?.()}
			</div>
			{#if footer}
				<footer class="dialog__footer">{@render footer()}</footer>
			{/if}
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
		backdrop-filter: blur(0);
		transition:
			background 190ms cubic-bezier(0.4, 0, 0.2, 1),
			backdrop-filter 190ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	.dialog[open]::backdrop {
		background: rgb(0 0 0 / 0.45);
		backdrop-filter: saturate(180%) blur(8px);
	}
	@starting-style {
		.dialog[open]::backdrop {
			background: rgb(0 0 0 / 0);
			backdrop-filter: blur(0);
		}
	}

	.dialog ::selection { background: rgb(var(--c) / 0.18); }
	.dialog:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.45);
		outline-offset: -2px;
	}

	:where(.dialog--small) { --w: 400px; }
	:where(.dialog--medium) { --w: 520px; }
	:where(.dialog--large) { --w: 720px; }
	:where(.dialog--fullscreen) {
		width: 100vw;
		height: 100vh;
		max-width: 100vw;
		max-height: 100vh;
	}
	.dialog--fullscreen .dialog__panel {
		border-radius: 0;
	}

	:where(.dialog--align-top) { margin-top: 6vh; margin-bottom: auto; }
	:where(.dialog--fullscreen.dialog--align-top) { margin: 0; }

	.dialog__panel {
		display: flex;
		flex-direction: column;
		min-height: 0;
		max-height: inherit;
		background: rgb(var(--gray-1));
		border-radius: 20px;
		box-shadow: 0 30px 80px -20px rgb(0 0 0 / 0.45);
		overflow: hidden;
		font-size: 0.875rem;
		transform: scale(var(--rb, 1));
		transform-origin: center;
	}

	.dialog__close {
		position: absolute;
		top: 12px;
		right: 12px;
		width: 32px;
		height: 32px;
		padding: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 0;
		border-radius: 10px;
		color: inherit;
		cursor: pointer;
		opacity: 0.7;
		transition:
			opacity 200ms cubic-bezier(0.4, 0, 0.2, 1),
			background-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 2;
	}
	.dialog__close:hover { opacity: 1; background: rgb(var(--text) / 0.08); }
	.dialog__close:focus-visible {
		outline: 2px solid rgb(var(--c) / 0.6);
		outline-offset: 2px;
	}

	.dialog__header {
		flex-shrink: 0;
		padding: 20px 56px 12px 24px;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.dialog__body {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		padding: 12px 24px 20px;
	}
	.dialog__header + .dialog__body { padding-top: 4px; }

	.dialog__footer {
		flex-shrink: 0;
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px 24px 20px;
	}
</style>
