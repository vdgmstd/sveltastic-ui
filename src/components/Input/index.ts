import Root from './Input.svelte';
import Control from './InputControl.svelte';
import Field from './InputField.svelte';
import Icon from './InputIcon.svelte';
import Label from './InputLabel.svelte';
import Message from './InputMessage.svelte';

/** Text field. Compound: `Input.Root` + `Input.Control` / `Input.Field` / `Input.Icon` / `Input.Label` / `Input.Message`. */
export const Input = { Root, Control, Field, Icon, Label, Message };

export type { InputRootProps, InputVariant, InputLabelStyle, InputState } from './Input.svelte';
export type { InputControlProps } from './InputControl.svelte';
export type { InputFieldProps } from './InputField.svelte';
export type { InputIconProps } from './InputIcon.svelte';
export type { InputLabelProps } from './InputLabel.svelte';
export type { InputMessageProps } from './InputMessage.svelte';
