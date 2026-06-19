import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** Palette colour names. The runtime maps `'warning'` → CSS token `--warn`. */
export type ColorName =
	| 'primary'
	| 'success'
	| 'danger'
	| 'warning'
	| 'info'
	| 'dark'
	| 'light'
	| 'facebook'
	| 'twitter'
	| 'youtube'
	| 'pinterest'
	| 'linkedin'
	| 'snapchat'
	| 'whatsapp'
	| 'tumblr'
	| 'reddit'
	| 'spotify'
	| 'amazon'
	| 'medium'
	| 'vimeo'
	| 'skype'
	| 'dribbble'
	| 'slack'
	| 'yahoo'
	| 'twitch'
	| 'discord'
	| 'telegram'
	| 'google-plus'
	| 'messenger';

/** Accepts a palette name, hex (`#fff`, `#0088ff`), `rgb(...)` / `rgba(...)`, or `"r,g,b"` triplet. */
export type Color = ColorName | (string & {});

export type Theme = 'light' | 'dark';

/** Predefined sizes — `xl`, `large`, default (medium), `small`, `mini`. The string half allows custom `px` / `rem`. */
export type Size = 'xl' | 'large' | 'medium' | 'small' | 'mini' | (string & {});

export type Variant =
	| 'default'
	| 'flat'
	| 'border'
	| 'gradient'
	| 'relief'
	| 'transparent'
	| 'shadow'
	| 'floating';

export type Shape = 'default' | 'circle' | 'square';

export type Placement =
	| 'top'
	| 'right'
	| 'bottom'
	| 'left'
	| 'top-start'
	| 'top-end'
	| 'right-start'
	| 'right-end'
	| 'bottom-start'
	| 'bottom-end'
	| 'left-start'
	| 'left-end';

/** Inclusive date range — both ends are `YYYY-MM-DD` ISO strings. Either side may be empty during partial selection. */
export type DateRange = { from?: string; to?: string };

/** Inclusive time range — both ends are `HH:MM` (or `HH:MM:SS`) ISO strings. */
export type TimeRange = { from?: string; to?: string };

/** Inclusive date+time range — both ends are `YYYY-MM-DDTHH:MM[:SS]` ISO strings. */
export type DateTimeRange = { from?: string; to?: string };

/** Adds a bindable `ref` to a props type so a consumer can capture the root element. */
export type WithElementRef<T, El extends HTMLElement = HTMLElement> = T & { ref?: El | null };

/** The bits-ui v2 `child` render-delegation snippet: receives the merged prop bag plus any part-specific extras. */
export type PartChild<Extra = Record<never, never>> = Snippet<
	[{ props: Record<string, unknown> } & Extra]
>;

/** Standard styled-part props: native attributes for `El` + `children` + the `child` snippet + a bindable `ref`. */
export type PartProps<El extends HTMLElement = HTMLElement, Extra = Record<never, never>> =
	WithElementRef<Omit<HTMLAttributes<El>, 'children'> & { children?: Snippet; child?: PartChild<Extra> }, El>;
