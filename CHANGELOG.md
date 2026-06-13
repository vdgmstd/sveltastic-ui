# Changelog

All notable changes to `sveltastic-ui` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project uses
semantic-ish versioning (see the note on 1.1.0 below).

## [1.1.5] — 2026-06-13

Bug-fix release from the expert-review register, plus the overlay `Portal` /
`forceMount` parts the 1.1.0 contract promised. Additive API; safe upgrade.

### Added

- **`Portal` parts on the overlays** — `Select.Portal`, `Menu.Portal`,
  `Tooltip.Portal`, `Dialog.Portal`, and `portalTarget` / `portalDisabled` /
  `forceMount` props on `DateTimePicker.Root`. Each `Portal` takes `to` (CSS
  selector or element, default `document.body`), `disabled` (render in place), and
  `forceMount` (keep the panel mounted while closed — presence via `data-state`,
  the kit open/close transition is skipped). This makes the documented
  `<Select.Portal><Select.Content/></Select.Portal>` composition resolve (it was
  `undefined`). Defaults are unchanged — anchored panels still portal to `body`, and
  `Dialog` stays in place unless you add `Dialog.Portal` (its native `<dialog>` is
  already top-layer).

### Fixed

- **Inline field labels (`labelStyle="inline"`) no longer overflow the component
  box.** `.input__label-block` previously used `height:100%` + `translateY(-80%)`,
  so its resting position scaled with the offset parent — Select / DateTimePicker
  rendered the label ~46px above their own box, overlapping the field above it in a
  stacked form. The label is now a bounded band anchored per DOM nesting
  (`.input >` shell vs `.input__field >` compound) and can never leave the wrapper.
- **Switch now participates in form submission.** `name` / `value` / `required` /
  `form` are routed to the inner `<input>` instead of landing on the outer `<span>`
  (where `name` was invalid and dropped from `FormData`).
- **Checkbox group members submit their `value` token**, not a bare `name=on` for
  every checked box — grouped `FormData` is now recoverable.
- **Body scroll-lock no longer blocks touch scrolling inside the locked overlay.**
  `scrollLock.lock()` takes the scrollable layer and allows `touchmove` within it
  (and within any `[data-scroll-lock-allow]` region); Dialog passes its panel.
- **Slider fires `onValueCommit` once on release / keypress**, not on every pointer
  move during a native thumb drag. `onValueChange` still streams live.
- **Readonly Checkbox group no longer toggles** or fires `onCheckedChange`; the
  native input is reverted, and `readonly` now cascades from the group to members.
- **Calendar month navigation works when a value is set without a `placeholder`.**
  The internal view month now wins over the selected date, so prev/next advance
  past the selected month (also fixes the DateTimePicker date panels).
- **Readonly DateTimePicker can no longer be mutated through its panel.** All value
  mutation funnels through a `readonly`-guarded `setValue`, and `readonly` is
  threaded into the Calendar / panel controls.
- **Select shows a "No data" placeholder when a filter matches nothing** instead of
  collapsing to an empty tray. The empty state now keys off the filtered count;
  new `emptyText` prop customises the default label, `Select.Empty` overrides the
  whole tray.
- **Slider tick marks no longer overflow the rail ends** — the first/last
  (min/max) ticks are dropped from the auto-rendered set; manual `Slider.Tick index`
  composition still addresses the full step list.
- **Avatar typing/"writing" badge animates on mount/unmount** (the scale transition
  was local, so it was skipped when toggled by a consumer `{#if}`; now `|global`).
- **Avatar action-icon strip icons sized down** — they were inheriting the large
  centred-fallback icon size (`--fs-xl`); now scoped to `--fs-md`.
- **Card horizontal**: content and footer share the same inline padding (right
  edges align). **Card frosted**: the heading gets a frosted pill background so it
  stays legible over the image.
- **Tabs panels no longer drift onto the tab list or break width mid-transition.**
  `.tabs-root` is now a self-contained block (was `display: contents`, which leaked
  List + panels into a parent flex/grid and made the crossfade reflow); the leaving
  panel is pinned at its own viewport box with `position: fixed`. Vertical
  orientation (inner wrapper) is unchanged.
- **Menu / Select / any anchored panel caps to the available viewport space and
  scrolls** instead of overflowing the page on long lists (`max-height` from the
  computed anchor space, scrollable body). The cap measures the **larger** of the
  two block sides, so a trigger near the bottom edge **flips the panel up** (and
  uses the full upper space) instead of collapsing to ~1 row; `max-height` is
  clamped to `[--popover-min-h: 9rem, …, --popover-max-h: 640px]` so the panel
  always shows at least ~3 rows and never grows absurdly tall.
- **Collapse no longer crashes with `bind:value={undefined}` / `bind:open={undefined}`.**
  `Collapse.Group` `value` and `Collapse` `open` are `$bindable()` without a
  fallback and resolve their default internally, so uncontrolled, callback, and
  bind-an-uninitialised-var all work.
- **Collapse expand/collapse uses a height-only transition** (was svelte `slide`,
  whose multi-property animation could skip on some WebKit / Windows builds).
- **Collapse `shape="circle"` keeps a constant corner curve** when opening (the
  pill radius was a `vmax` value that re-rounded as the body grew).
- **Cards no longer impose a `max-width`** (350/480/460/300px removed) — they fill
  their container and the consumer controls width. **Card hover no longer shifts the
  card's position** (only the shadow changes); the position lift broke usability.
- **Collapse render-delegation (`Collapse.Root` `child` snippet) renders correctly.**
  The component's styles moved from a scoped `<style>` to a global `styles/collapse.css`
  (matching `field.css`/`menuItem.css`/`radio.css`) so a consumer-owned root element
  gets them — and so the `.collapse` BEM block beats Tailwind's `.collapse` utility
  (`visibility: collapse`), which had hidden the delegated element entirely.
- **Reduced-motion handling removed kit-wide.** Components (Collapse, Calendar,
  Checkbox, Radio, Alert, TimeWheel, smooth-scroll) now always animate fully and no
  longer zero their durations under `prefers-reduced-motion` — previously inconsistent
  (only some components gated), which made Collapse/Calendar appear "broken" on
  reduced-motion machines (common on Windows/VMs) while the rest animated.

### Fixed — accessibility

- **Menu** restores focus to the trigger after selecting an item.
- **Menu.Trigger** applies its merged props (ref / `data-*` / rest) in the default
  (non-`child`) path; **Collapse.Trigger** keeps roving-focus registration under
  `child` delegation.
- **Roving focus** tracks disabled state reactively, so disabling the item that
  currently holds the tab stop no longer strands the whole composite out of Tab order.
- **Avatar** image `alt` is announced again (the clip wrapper is only `aria-hidden`
  for decorative/empty-alt images).
- **Progress** wires `aria-labelledby` to a visible `Progress.Label` (keeps a
  consumer `ariaLabel` as fallback) so it always has an accessible name.
- **Chip**: an interactive (`role="button"`) chip's close is now presentational and
  the chip is removable via Delete/Backspace — no focusable descendant of `role=button`.
- **List** drops `role="list"` in list mode (no aria-required-children violation);
  **Pagination** ellipsis is keyboard-reachable and `max` clamps to ≥5 so the current
  page always renders.
- **Dialog** no longer closes when a text-selection drag starts in the panel and
  ends on the backdrop (pointerdown-origin tracked); a real backdrop click still closes.
- **Anchored-overlay ARIA now lands on the real trigger, not the Popover wrapper.**
  The positioning anchor is demoted to `role="presentation"` (no `tabindex`/ARIA); a
  trigger prop-bag (`role`/`aria-haspopup`/`aria-expanded`/`aria-controls`/`data-*`)
  is routed onto the consumer's focusable element. Consequences: **Menu** trigger
  buttons carry the popup ARIA with no `div[role=button]`-around-`<button>`
  nested-interactive violation; **Select** triggers are a complete WAI-ARIA combobox
  (`role="combobox"` + `aria-expanded` + `aria-controls`→listbox +
  `aria-activedescendant`→option) on the real input, and the previous double tab-stop
  is gone; **DateTimePicker** gains `aria-controls`. Select's chips / custom-value
  triggers (which have no native input) get a focusable combobox host on the field
  slot, so keyboard focus + open work without the old wrapper tab stop.
- **Tooltip** joins the top layer (`popover` API) so a tooltip triggered inside a
  modal `<dialog>` is visible instead of painting beneath it.

### Fixed — RTL

- **The kit now mirrors under `dir="rtl"`.** Direction-sensitive CSS across the
  fields (`field.css`), menu rows, radios, collapse, Switch, Chip, ButtonGroup,
  AvatarGroup, Alert, Card, List, Tabs, Checkbox, Select rows, and the
  DateTimePicker panel was moved to logical properties (`inset-inline-*`,
  `padding/margin-inline-*`, `text-align: start`, logical corner radii,
  `border-inline-*`). Field labels + leading icons, chip/alert close affordances,
  and grouped-button corners now sit on the correct side in RTL.
- Properties with no logical form get `[dir='rtl']` overrides: the **Switch** knob
  slide, background swoop and on/off-label motion; the floating-label
  `transform-origin` and clickable-icon hover lift; the AvatarGroup hover peek; the
  Alert progress-bar origin; and the **Pagination** prev/next caret flip.
- **Slider** mirrors in RTL too — the fill, thumb, tooltip, and ticks position via
  `inset-inline-*`, so the active fill grows from the right (min) and tracks the
  native range input's RTL flip (ArrowRight decreases).
- LTR rendering is unchanged (logical properties are identical to physical in LTR;
  RTL behaviour is additive).

### Fixed — localization & internals

- **Upload** gains overridable label props (`countLabel`, `clearLabel`, `removeLabel`,
  `Upload.ItemRemove` `ariaLabel`) and **NotificationsHost** a `closeLabel` — no more
  hard-coded user-facing strings; consumer `aria-label` is no longer clobbered.
- **mergeProps** short-circuits a chained handler when an earlier one calls
  `preventDefault()` (bits-ui parity — a consumer handler can cancel the kit's).
- **ripple** no longer leaks an abort-listener closure (+ detached DOM) per click.
- **ScrollbarHost** uses a per-target registry, so one host per scope (shadow root /
  iframe) works as documented.
- **On-accent text/icons read the `--on-accent` token** instead of a hard-coded white
  (Button, Switch, Slider, Calendar, Alert, field icon-fill, Collapse) — identical
  pixels today, but overriding `--on-accent` now themes the whole kit consistently.
- **Tabs crossfade keeps the leaving panel in place.** The outgoing panel was pinned
  `position: fixed` at its measured rect, which flashed it to the viewport's top-left
  over other content when the panel's box was unusual (e.g. a 0×0 layout context). It
  now pins `position: absolute` within the `position: relative` `.tabs-root` via offset
  coords (scroll-safe), and a 0-size panel is left in flow rather than pinned to (0,0).
- **DateTimePicker panel (calendar/time) picks update the field again**, while typing
  still preserves the caret — the input-reflection guard is now source-aware (skips only
  the user's own keystrokes, not panel-driven changes that keep the field focused).
- **DateTimePicker field keeps the caret while you type.** Its input-sync re-reflected
  the canonical formatted value on a timer even mid-edit, rewriting the masked input
  and snapping the caret to the end; it now holds off while the field is focused
  (panel picks still reflect). Forward typing and mid-string edits keep their position.
- **No more `ref` churn during field animations.** Input / Textarea / InputNumber /
  Select / DateTimePicker field shells hoisted their `{@attach}` ref callbacks to a
  stable identity, so a bound `ref` no longer flickers null↔node on every focus-bloom,
  label-float, icon-pulse, or rolling-digit frame.
- **`surfaceRipple` focus mode now honours `disabled`.** The focus bloom fired on
  every focusin regardless of the `disabled` option (it was only consulted in the
  autoripple branch), so `border`-variant Input/Textarea and inert (disabled/readonly)
  InputNumber fields still bloomed on focus. The bloom is now gated by a live
  `disabled` check at spawn time, effective at setup, on update, and per-focusin.
- **`child` render-delegation on `Tabs.List`, `Segmented.Root`, and `List.Item` now
  reproduces the full look.** Each passes the kit's inner content to the snippet as a
  `body` parameter — `{#snippet child({ props, body })}` → render `{@render body()}`
  inside your element — so the sliding-indicator thumb (Tabs/Segmented) and the
  fill/loading background + ripple (List.Item) are preserved, matching the existing
  `Card`/`Chip` `child` shape. Their styles also moved to global stylesheets
  (`tab-list.css` / `segmented.css` / `list-item.css`, like `collapse.css`), so a
  delegated element — which lacks the component's scope hash — still gets the full track
  background, padding, active fill, focus ring, and on-accent text. Rendered output on the
  kit's own (non-delegated) element is unchanged.
- **`Chip` `child` delegation reproduces the full look too.** Chip's styles moved to a
  global `chip.css`, so a delegated chip host (`{#snippet child({ props, body })}`) gets
  the variant background, pill radius, padding, active fill, and on-accent text. (`Card`
  already behaved correctly — its host `.card-content` styles were global; only the inner
  card surface is scoped, and that is always kit-rendered.)

## [1.1.0] — 2026-06-09

> **⚠️ Breaking, despite the minor version.** This release replaces every
> component's flat API with a compound **`X.Root` + parts** surface and **removes
> the bare callable** (`import { Button }` no longer renders as `<Button>`; use
> `<Button.Root>`). By strict semver this is a major change — it ships as `1.1.0`
> by maintainer decision because the `1.0.x` line had no external consumers.
> Treat upgrading from `1.0.x` as a migration, not a bump.

### Changed — BREAKING

- **Every component is now a compound namespace.** Each barrel exports
  `export const X = { Root, ...Parts }` — e.g. `Button.Root`/`Button.Icon`/`Button.Group`,
  `Card.Root`/`Card.Header`/`Card.Body`/`Card.Footer`,
  `Select.Root`/`Select.Trigger`/`Select.Content`/`Select.Item`/`Select.Group`,
  `Alert.Root`/`Alert.Icon`/`Alert.Title`/`Alert.Description`/`Alert.Action`.
  The bare `<X>` form is gone.
- **bits-ui v2-aligned contract** across the kit: the `child` snippet for
  render-delegation, a bindable `ref` prop (replacing `el`), `data-*` state hooks,
  one `$bindable` value plus `on<X>Change` (+ `on<X>ChangeComplete`), and
  `Portal` + `forceMount` for overlays.
- Named content-snippet props removed in favour of two snippets per part —
  `children` (default content) and `child` (render-delegation).
- Public prop/`data-*`/event names harmonised across components; shared unions
  (`Size`/`Shape`/`Variant`) are now single sources, not per-component clones.
- Size-scale values (`border-radius`/`font-size`/`padding`/`gap`) conformed to the
  canonical token scale in `styles/tokens.css`; a few divergent components shifted
  by ≤1px as a result. All other visual identity (curves, durations, colours) is
  frozen from `1.0.x`.

### Fixed

- **Select / DateTimePicker focus glow** no longer vanishes when the dropdown
  opens. The focus "bloom" is now a Svelte-rendered node driven by component-owned
  Tweens + `style:` directives, so re-rendering the compound trigger on open can't
  reconcile it away (the previous action-created node was evicted). Plain
  Input/Textarea/InputNumber keep the action-based bloom (their field never
  re-renders); both paths are visually identical.
- `Select.Trigger`: caret rotation moved to a `data-state` CSS hook; the ref
  attachment is minted once instead of inside a `$derived`, removing per-open churn.
- **Tabs / Segmented / List**: the active item's label colour now transitions
  instead of snapping/vanishing on switch.
- **Tabs** panel transition pins the leaving panel so it crossfades in place
  rather than stacking in flow.
- **Input**: browser-autofill styling (token text/caret, no yellow/blue wash) for
  `:-webkit-autofill` + `:autofill`; Safari password-dot rendering; mask/value
  font-size alignment on coarse pointers.
- `user-select` swept across interactive chrome (never on text fields / copyable
  prose).

### Internal

- Shared primitives extracted to `state/` and `primitives/` (`pressBounce`,
  `slidingIndicator`, `rovingFocus`, focus-trap stack, scroll-lock, typeahead,
  escape-layer, `isUsingKeyboard`, `mergeProps`, `attachRef`).
- Cross-browser Playwright suite (`docs/e2e/`) runs on Chromium + Firefox locally
  and adds WebKit in CI.

## [1.0.4]

Last release of the flat-API line. See git history.
