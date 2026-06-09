import Root from './InputNumber.svelte';
import Field from './InputNumberField.svelte';
import Increment from './InputNumberIncrement.svelte';
import Decrement from './InputNumberDecrement.svelte';

/** Numeric stepper. Pure compound: `InputNumber.Root` + `InputNumber.Field` + `InputNumber.Increment` + `InputNumber.Decrement`. */
export const InputNumber = { Root, Field, Increment, Decrement };

export type { InputNumberRootProps } from './InputNumber.svelte';
export type { InputNumberFieldProps } from './InputNumberField.svelte';
export type { InputNumberIncrementProps } from './InputNumberIncrement.svelte';
export type { InputNumberDecrementProps } from './InputNumberDecrement.svelte';
