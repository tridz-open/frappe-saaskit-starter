import type { ReactNode } from "react";

/** Two-column label/value list. items: [label, value] pairs. */
export function DescriptionList({ items, ...rest }: { items: Array<[ReactNode, ReactNode]> } & React.ComponentPropsWithRef<"dl">) {
  return (
    <dl data-slot="description-list" {...rest}>
      {items.map(([k, v], i) => (
        <div key={i}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}
