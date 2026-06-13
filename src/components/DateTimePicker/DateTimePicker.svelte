<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Color } from '../../types';
	import type { DateLike, WeekStart } from '../../utils/date';
	import type { MaskOptions } from '../../actions/mask';
	import type { InputLabelStyle } from '../../primitives/fieldShell.svelte';
	import type { PopoverPlacement } from '../../primitives/Popover.svelte';
	import type { PortalTarget } from '../../actions/portal';

	export type DateTimePickerType = 'time' | 'date' | 'datetime';

	export type DateTimePickerRootProps = {
		/** What kind of value the picker captures. */
		type?: DateTimePickerType;
		/** Bound value for `'time'` (`HH:MM[:SS]`), `'date'` (`YYYY-MM-DD`), `'datetime'` (`YYYY-MM-DDTHH:MM[:SS]`). */
		value?: string;
		/** Bindable open state of the dropdown. */
		open?: boolean;
		/** Close the dropdown when the user clicks outside. */
		closeOnClickOutside?: boolean;
		/** Close the dropdown on Escape. WAI-ARIA expects this always available. */
		closeOnEsc?: boolean;
		/** Show the seconds wheel + segment (time-bearing types). */
		showSeconds?: boolean;
		/** Render the AM/PM toggle and display in 12-hour mode. The bound value remains 24-hour ISO. */
		hour12?: boolean;
		/** Calendar locale (date-bearing types). Defaults to `'en-US'`. */
		locale?: string;
		/** First day of the week (date-bearing types). Defaults to the locale's convention. */
		weekStart?: WeekStart;
		/** Lower bound (date-bearing types, inclusive). */
		min?: DateLike;
		/** Upper bound (date-bearing types, inclusive). */
		max?: DateLike;
		/** Standard disabled. */
		disabled?: boolean;
		/** Read-only — input + panel both inert. */
		readonly?: boolean;
		/** Palette accent. Date-bearing types narrow the calendar chrome to `primary`/`warning`. */
		color?: Color;
		/** Placeholder for the trigger input. */
		placeholder?: string;
		/** Field label. */
		label?: string;
		/** Label placement / behaviour, matches `Input` (`'default' | 'placeholder' | 'inline'`). */
		labelStyle?: InputLabelStyle;
		/** Accessible name for the field + panel when no visible `label` is set. */
		ariaLabel?: string;
		/** Stretch the trigger to its container. */
		block?: boolean;
		/** Dropdown placement relative to the trigger. */
		placement?: PopoverPlacement;
		/** Portal target for the panel. CSS selector or element; defaults to `document.body`. */
		portalTarget?: PortalTarget;
		/** Render the panel in place instead of portalling it. */
		portalDisabled?: boolean;
		/** Keep the panel mounted while closed (presence via `data-state`). */
		forceMount?: boolean;
		/** Side of the field where the icon sits. Defaults to `'after'`. */
		iconPosition?: 'before' | 'after';
		/** Override the input mask. Defaults are derived from `type`, `showSeconds`, and `hour12`. */
		mask?: MaskOptions;
		/** Custom icon glyph snippet. Falls back to a clock (time) or calendar (date / datetime). */
		icon?: Snippet;
		/** Fires on every committed value change. */
		onValueChange?: (value: string) => void;
		/** Fires when the dropdown open state changes. */
		onOpenChange?: (open: boolean) => void;
		/** Class merged onto the trigger wrapper. */
		class?: string;
		/** Inline style merged onto the trigger wrapper. */
		style?: string;
	};
</script>

<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { CalendarBlankIcon, ClockIcon } from 'phosphor-svelte';
	import InputShell from '../../primitives/InputShell.svelte';
	import Popover from '../../primitives/Popover.svelte';
	import TimePanel from './panels/TimePanel.svelte';
	import DatePanel from './panels/DatePanel.svelte';
	import DateTimePanel from './panels/DateTimePanel.svelte';
	import { DateTimePickerRootState } from './dateTimePicker.svelte';
	import { setDtpCtx } from './context';

	const preserveFocus: Attachment<HTMLElement> = (node) => {
		const handler = (e: MouseEvent): void => e.preventDefault();
		node.addEventListener('mousedown', handler);
		return () => node.removeEventListener('mousedown', handler);
	};

	let {
		type = 'time',
		value = $bindable(''),
		open = $bindable(false),
		closeOnClickOutside = true,
		closeOnEsc = true,
		showSeconds = false,
		hour12 = false,
		locale,
		weekStart,
		min,
		max,
		disabled = false,
		readonly = false,
		color = 'primary',
		placeholder,
		label,
		labelStyle,
		ariaLabel,
		block = false,
		placement = 'bottom-start',
		portalTarget,
		portalDisabled = false,
		forceMount = false,
		iconPosition = 'after',
		mask,
		icon,
		onValueChange,
		onOpenChange,
		class: className,
		style: userStyle,
		...rest
	}: DateTimePickerRootProps = $props();

	const fieldId = $props.id();
	const picker = new DateTimePickerRootState(
		{
			getValue: () => value,
			setValueProp: (v) => { value = v; },
			getOpen: () => open,
			setOpenProp: (v) => { open = v; },
			get type() { return type; },
			get showSeconds() { return showSeconds; },
			get hour12() { return hour12; },
			get mask() { return mask; },
			get placeholder() { return placeholder; },
			get label() { return label; },
			get ariaLabel() { return ariaLabel; },
			get color() { return color; },
			get disabled() { return disabled; },
			get readonly() { return readonly; },
			get locale() { return locale; },
			get weekStart() { return weekStart; },
			get min() { return min; },
			get max() { return max; },
			onValueChange: (v) => onValueChange?.(v),
			onOpenChange: (v) => onOpenChange?.(v)
		},
		fieldId
	);
	setDtpCtx(picker);

	$effect(() => picker.syncPendingTime());
	$effect(() => picker.syncInput());
	$effect(() => picker.syncFocusReturn());
	$effect(() => () => picker.destroy());
</script>

<Popover
	bind:open
	triggerOn="manual"
	popupRole="dialog"
	autoFocus={false}
	modal={false}
	ariaLabel={picker.dialogAriaLabel}
	{placement}
	closeOnSelect={false}
	{closeOnEsc}
	{closeOnClickOutside}
	{block}
	{portalTarget}
	{portalDisabled}
	{forceMount}
	class={className}
	style={userStyle}
>
	{#snippet trigger({ props })}
		<InputShell
			type="text"
			value={picker.inputValue}
			{label}
			{labelStyle}
			placeholder={picker.placeholderText}
			{color}
			iconColor={color}
			{disabled}
			{readonly}
			{block}
			icon={iconSnippet}
			{iconPosition}
			mask={picker.resolvedMask}
			forceFocus={open}
			oninput={(e: Event) => picker.handleInputText((e.currentTarget as HTMLInputElement).value)}
			onkeydown={(e: KeyboardEvent) => picker.handleFieldKeydown(e)}
			onfocus={picker.handleFieldFocus}
			onblur={() => picker.commitInput()}
			id={picker.fieldId}
			data-testid="datetime-picker"
			{...props}
			{...picker.fieldProps}
			{...rest}
		/>
	{/snippet}

	<div
		class="dtp-shell"
		bind:this={picker.shellEl}
		style:--c={picker.triplet}
		{...picker.contentProps}
		{@attach preserveFocus}
	>
		{#if picker.isTime}
			<TimePanel />
		{:else if picker.isDate}
			<DatePanel />
		{:else}
			<DateTimePanel
				value={picker.calendarValue}
				time={picker.parsedTime}
				{color}
				{hour12}
				{showSeconds}
				{locale}
				{weekStart}
				{min}
				{max}
				{disabled}
				{readonly}
				onchange={picker.emitDateTimeText}
			/>
		{/if}
	</div>
</Popover>

{#snippet iconSnippet()}
	<span class="dtp-icon" role="presentation" {@attach preserveFocus}>
		{#if icon}
			{@render icon()}
		{:else if picker.isTime}
			<ClockIcon size={18} weight="regular" />
		{:else}
			<CalendarBlankIcon size={18} weight="regular" />
		{/if}
	</span>
{/snippet}

<style>
	.dtp-shell {
		display: inline-flex;
		min-height: 64px;
		max-width: calc(100vw - 16px);
		padding: var(--space-6);
		color: rgb(var(--text));
		box-sizing: border-box;
		-webkit-user-select: none;
		user-select: none;
	}
	@media (max-width: 480px) {
		.dtp-shell { padding: var(--space-5); }
	}
</style>
