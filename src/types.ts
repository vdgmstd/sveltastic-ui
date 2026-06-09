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
