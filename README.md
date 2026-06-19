# SVELTASTIC UI [BETA] [WIP]

[![npm version](https://img.shields.io/npm/v/sveltastic-ui?style=flat&color=cb3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/sveltastic-ui)
[![Publish to npm](https://github.com/vdgmstd/sveltastic-ui/actions/workflows/publish.yml/badge.svg)](https://github.com/vdgmstd/sveltastic-ui/actions/workflows/publish.yml)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat)](#license)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?style=flat&logo=svelte&logoColor=white)](https://svelte.dev)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![SSR-safe](https://img.shields.io/badge/SSR-safe-success?style=flat)](#design-principles)
[![tree-shakable](https://img.shields.io/badge/tree--shakable-success?style=flat)](#design-principles)

## Documentation

Live playground + per-component API reference at **[sveltastic-ui-docs](https://vdgmstd.github.io/sveltastic-ui-docs/)**.

Svelte 5 (runes) + Tailwind v4 component library. **33 components**, one barrel import, every visual token overridable with one CSS line.

## Install

```sh
npm install sveltastic-ui svelte@^5 tailwindcss@^4 @tailwindcss/vite@^4
```

`phosphor-svelte` (the kit's icon set) is a regular dependency — it installs automatically, no separate step.

## Setup (SvelteKit + Vite)

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default {
	plugins: [tailwindcss(), sveltekit()]
};
```

Import the kit's stylesheet once. The recommended form is a CSS `@import` in your
app's global stylesheet, placed **before** Tailwind so the kit's `@theme` tokens are
in scope:

```css
/* src/app.css (or your global stylesheet) */
@import 'sveltastic-ui/styles';
@import 'tailwindcss';
```

The side-effect JS import also works and type-checks in a TypeScript-strict app (the
package ships a type declaration for this entry):

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import 'sveltastic-ui/styles';
</script>
```

### No-flash theme bootstrap (recommended)

Drop this inline script into `<head>` in `src/app.html` so the dark theme applies before the first paint — no white flash on dark-mode devices:

```html
<!-- src/app.html, inside <head>, BEFORE %sveltekit.head% -->
<script>
	(function () {
		try {
			var saved = localStorage.getItem('sveltastic-ui:theme');
			var resolved =
				saved === 'light' || saved === 'dark'
					? saved
					: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
						? 'dark'
						: 'light';
			document.documentElement.setAttribute('data-theme', resolved);
		} catch (_) {}
	})();
</script>
```

Then call `theme.hydrate()` once in your root layout `onMount` so the kit's reactive state reflects the attribute the script already set:

```svelte
<script>
	import { onMount } from 'svelte';
	import { theme } from 'sveltastic-ui';
	onMount(() => theme.hydrate());
</script>
```

## Quick start

```svelte
<script lang="ts">
	import { Button, notify, NotificationsHost } from 'sveltastic-ui';
</script>

<NotificationsHost />

<Button.Root
	color="primary"
	onclick={() => notify({ title: 'Saved', color: 'success' })}
>
	Save
</Button.Root>
```

Every component is a compound namespace — its root part is `X.Root`, with styled
sub-parts hanging off the same import (e.g. `Button.Icon`, `Button.Group`):

```svelte
<script lang="ts">
	import { Button } from 'sveltastic-ui';
	import { FloppyDisk } from 'phosphor-svelte';
</script>

<Button.Group>
	<Button.Root color="primary">
		<Button.Icon><FloppyDisk /></Button.Icon>
		Save
	</Button.Root>
	<Button.Root variant="border">Cancel</Button.Root>
</Button.Group>
```

## Components

### Forms (18)

- **Button** (`Button.Root` + `Button.Icon` / `Button.Group`)
- **Input**
- **InputNumber**
- **Textarea**
- **Checkbox**
- **RadioGroup** (`RadioGroup.Root` + `RadioGroup.Item` / `Indicator` / `Label`)
- **Switch**
- **Toggle** (`Toggle.Root` — pressed-state toggle button)
- **ToggleGroup** (`ToggleGroup.Root` + `ToggleGroup.Item`)
- **Select**
- **Combobox** (`Combobox.Root` + `Input` / `Content` / `Item` / `Group` / `Empty`)
- **Slider**
- **Segmented**
- **RatingGroup** (`RatingGroup.Root` + `RatingGroup.Item`)
- **PinInput** (`PinInput.Root` + `PinInput.Cell`)
- **Upload**
- **DateTimePicker**
- **Calendar**

### Layout (5)

- **Card** (`Card.Root` + `Card.Header` / `Body` / `Footer` / `Media` / `Image` / `Overlay`)
- **Divider** (`Divider.Root` + `Divider.Line` / `Label`)
- **List** (`List.Root` + `List.Item` / `Group` / `Separator` / …)
- **Collapse** (`Collapse.Root` + `Collapse.Trigger` / `Content` / `Group` / …)
- **Tabs** (`Tabs.Root` + `Tabs.List` / `Trigger` / `Content`)

### Status (6)

- **Alert** (`Alert.Root` + `Alert.Icon` / `Title` / `Description` / `Action` / `Close` / …)
- **Avatar** (`Avatar.Root` + `Avatar.Image` / `Fallback` / `Badge` / `Group` / …)
- **Chip** (`Chip.Root` + `Chip.Icon` / `Close`)
- **Progress**
- **Toast** (`Toast.Provider` + `Toast.Root` / `Icon` / `Title` / `Description` / `Action` / `Close`) + imperative `toast(...)`
- **Tooltip**

### Overlay & navigation (4)

- **Dialog**
- **Popover** (`Popover.Root` + `Popover.Trigger` / `Portal` / `Content` / `Close`)
- **Menu**
- **Pagination**

### Imperative APIs

- `notify(...)` + `<NotificationsHost />` — toast notifications
- `<ScrollbarHost />` — kit-wide auto-hiding scrollbar

### Actions

- `use:ripple` — material-style click ripple

## Theming

Every visual constant is a CSS variable in `@theme`. Rebrand with one rule:

```css
@import 'sveltastic-ui/styles';

:root {
	--primary: 21 94 117;   /* R G B triplets — enables rgb(var(--primary) / 0.4) */
	--radius: 10px;
	--background: 250 250 250;
}

[data-theme='dark'] {
	--background: 18 18 22;
}
```

Dark mode: set `data-theme="dark"` on `<html>`. The kit picks it up automatically.

## Design principles

- **Same prop name = same meaning everywhere.** `color`, `size`, `variant`, `shape`, `disabled`, `loading` mean the same thing across every component.
- **Compound parts everywhere.** Each component is a namespace — a `X.Root` plus styled sub-parts that share state through context (`Card.Header`, `Tabs.Trigger`, `Select.Item`). The bare `<X>` form was removed in 1.1.0. Imperative helpers (`notify(...)`) are the one exception.
- **Pure Svelte 5.** No `createEventDispatcher`, no `svelte/store`, no `<svelte:component>`. Runes + callback props + actions.
- **SSR-safe.** Zero top-level DOM access. Works in SvelteKit / Astro / vanilla Vite + Vinxi.
- **Tree-shakable.** Named re-exports only — `import { Button }` ships only Button.
- **Resource discipline.** Every action returns `destroy`, every observer disconnects, every timer is cancellable. No leaks at 50 mount/unmount cycles.
- **i18n agnostic.** Components accept text via snippet props; the kit imposes no locale.
- **Accessible by default.** Native semantics first; focus traps + keyboard navigation built in for overlays.

## Peer dependencies

| Package | Range |
|---|---|
| `svelte` | `^5` |
| `tailwindcss` | `^4` |

`phosphor-svelte` ships as a bundled dependency (auto-installed); `@tailwindcss/vite` is needed only for the Vite/SvelteKit setup below.

## License

MIT © [vdgmstd](https://github.com/vdgmstd)
