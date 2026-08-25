import type { ComponentPropsWithoutRef, ReactNode } from "react";

interface BaseProps extends ComponentPropsWithoutRef<"table"> {
  children: ReactNode;
}

interface SectionProps extends ComponentPropsWithoutRef<"thead"> {
  children: ReactNode;
}

interface BodyProps extends ComponentPropsWithoutRef<"tbody"> {
  children: ReactNode;
}

interface RowProps extends ComponentPropsWithoutRef<"tr"> {
  children: ReactNode;
}

interface HeaderCellProps extends ComponentPropsWithoutRef<"th"> {
  children: ReactNode;
}

interface CellProps extends ComponentPropsWithoutRef<"td"> {
  children: ReactNode;
}

export function Table({ children, className = "", ...props }: BaseProps) {
  return (
    <table className={["min-w-full border-separate border-spacing-y-2 text-sm", className].join(" ").trim()} {...props}>
      {children}
    </table>
  );
}

export function TableHead({ children, className = "", ...props }: SectionProps) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }: BodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "", ...props }: RowProps) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = "", ...props }: HeaderCellProps) {
  return (
    <th className={["px-3", className].join(" ").trim()} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...props }: CellProps) {
  return (
    <td className={["px-3 py-3", className].join(" ").trim()} {...props}>
      {children}
    </td>
  );
}
