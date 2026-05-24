# sveltastic-ui

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

Svelte 5 (runes) + Tailwind v4 component library. **26 components**, one barrel import, every visual token overridable with one CSS line.

## Install

```sh
npm install sveltastic-ui svelte@^5 tailwindcss@^4 @tailwindcss/vite@^4 phosphor-svelte@^3
```

## Setup (SvelteKit + Vite)

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default {
	plugins: [tailwindcss(), sveltekit()]
};
```

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

<Button
	color="primary"
	onclick={() => notify({ title: 'Saved', color: 'success' })}
>
	Save
</Button>
```

## Components

### Forms (13)

- **Button** (+ `ButtonGroup`)
- **Input**
- **InputNumber**
- **Textarea**
- **Checkbox**
- **Radio**
- **Switch**
- **Select**
- **Slider**
- **Segmented**
- **Upload**
- **DateTimePicker**
- **Calendar**

### Layout (5)

- **Card**
- **Divider**
- **List** (+ `ListItem`, `ListGroup`, `ListDivider`)
- **Collapse** (+ `CollapseGroup`)
- **Tabs** (+ `Tab`, `TabList`, `TabPanel`)

### Status (5)

- **Alert**
- **Avatar** (+ `AvatarGroup`)
- **Chip**
- **Progress**
- **Tooltip**

### Overlay & navigation (3)

- **Dialog**
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
- **One composition shape per component** — named snippet props (`Card { header }`), compound subcomponents (`Tabs.Tab`), or imperative (`notify(...)`). Never mixed.
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
| `phosphor-svelte` | `^3` |

## License

MIT © [vdgmstd](https://github.com/vdgmstd)
