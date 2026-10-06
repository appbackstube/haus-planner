import { NumberField } from '@base-ui/react/number-field';

interface NumberInputProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  unit?: string;
  min?: number;
  step?: number;
}

export function NumberInput({
  label,
  value,
  onValueChange,
  unit = '€',
  min = 0,
  step = 1,
}: NumberInputProps) {
  return (
    <NumberField.Root
      value={value}
      onValueChange={(newValue: number | null) => onValueChange(newValue ?? 0)}
      locale="de-AT"
      min={min}
      step={step}
      className="flex flex-col gap-1"
    >
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
        <NumberField.Input className="w-full px-3 py-2 text-sm text-slate-900 outline-none" />
        <NumberField.Group className="flex border-l border-slate-200">
          <NumberField.Decrement className="px-2 text-slate-400 hover:text-slate-700">−</NumberField.Decrement>
          <span className="flex items-center px-2 text-xs text-slate-500">{unit}</span>
          <NumberField.Increment className="px-2 text-slate-400 hover:text-slate-700">+</NumberField.Increment>
        </NumberField.Group>
      </div>
    </NumberField.Root>
  );
}
