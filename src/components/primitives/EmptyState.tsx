import type { ComponentPropsWithRef, ReactNode } from "react";

export type EmptyStateProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action, className, ...rest }: EmptyStateProps) {
  return (
    <div data-slot="empty-state" className={className} {...rest}>
      <p data-slot="empty-state-title">{title}</p>
      {description ? <p data-slot="empty-state-description">{description}</p> : null}
      {action ? <div data-slot="empty-state-action">{action}</div> : null}
    </div>
  );
}
