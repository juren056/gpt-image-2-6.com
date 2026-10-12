import {
  Children,
  Fragment,
  isValidElement,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

type Option = { value: string; label: ReactNode; disabled?: boolean };
function readOptions(children: ReactNode, disabled = false): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        children?: ReactNode;
        value?: string | number;
        disabled?: boolean;
      }>(child)
    )
      return [];
    if (child.type === 'option')
      return [
        {
          value: String(child.props.value ?? child.props.children ?? ''),
          label: child.props.children,
          disabled: disabled || child.props.disabled,
        },
      ];
    if (child.type === 'optgroup' || child.type === Fragment)
      return readOptions(
        child.props.children,
        disabled || child.props.disabled
      );
    return [];
  });
}

/** Shared styled selector, retaining native form values and existing change handlers. */
export function SiteSelect({
  children,
  className,
  value,
  defaultValue,
  id,
  disabled,
  autoFocus,
  style,
  ...props
}: ComponentProps<'select'>) {
  const native = useRef<HTMLSelectElement>(null);
  const options = readOptions(children);
  const [uncontrolled, setUncontrolled] = useState(
    String(defaultValue ?? options[0]?.value ?? '')
  );
  const selected = value === undefined ? uncontrolled : String(value);
  return (
    <Select.Root
      value={selected}
      items={options}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === null || !native.current) return;
        setUncontrolled(next);
        native.current.value = next;
        native.current.dispatchEvent(new Event('change', { bubbles: true }));
      }}
    >
      <Select.Trigger
        id={id}
        autoFocus={autoFocus}
        className={cn('site-select', className)}
        style={style}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
        aria-invalid={props['aria-invalid']}
      >
        <Select.Value className="site-select-value" />
        <Select.Icon className="site-select-arrow">
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>
      <select
        {...props}
        ref={native}
        value={selected}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        className="site-select-native"
      >
        {children}
      </select>
      <Select.Portal>
        <Select.Positioner
          className="site-select-positioner"
          sideOffset={7}
          align="start"
          alignItemWithTrigger={false}
        >
          <Select.Popup className="site-select-popup">
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="site-select-item"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="site-select-check">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
