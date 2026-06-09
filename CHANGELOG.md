# Changelog

All notable changes to `sveltastic-ui` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project uses
semantic-ish versioning (see the note on 1.1.0 below).

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
