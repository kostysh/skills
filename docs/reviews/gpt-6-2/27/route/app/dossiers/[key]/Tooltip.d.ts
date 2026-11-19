import type {
  ForwardRefExoticComponent,
  ReactElement,
  ReactNode,
  RefAttributes,
} from 'react';

export const Tooltip: ForwardRefExoticComponent<{
  label: ReactNode;
  children: ReactNode;
} & RefAttributes<HTMLButtonElement>>;
export function ComponentDemo(): ReactElement;
