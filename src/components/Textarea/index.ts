import Root from './Textarea.svelte';
import Control from './TextareaControl.svelte';
import Field from './TextareaField.svelte';
import Label from './TextareaLabel.svelte';
import Message from './TextareaMessage.svelte';

/** Multiline text field. Compound: `Textarea.Root` + `Textarea.Control` / `Textarea.Field` / `Textarea.Label` / `Textarea.Message`. */
export const Textarea = { Root, Control, Field, Label, Message };

export type {
	TextareaRootProps,
	TextareaVariant,
	TextareaLabelStyle,
	TextareaState
} from './Textarea.svelte';
export type { TextareaControlProps } from './TextareaControl.svelte';
export type { TextareaFieldProps } from './TextareaField.svelte';
export type { TextareaLabelProps } from './TextareaLabel.svelte';
export type { TextareaMessageProps } from './TextareaMessage.svelte';
