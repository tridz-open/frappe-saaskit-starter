import type { ReactNode } from "react";
import { ExperimentalBadge } from "./Experimental";

export function PageHeader({ title, description, actions, experimental }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; experimental?: boolean }) {
  return (
    <div data-slot="page-header">
      <div>
        <h1>{title}</h1>
        {experimental ? <p><ExperimentalBadge /></p> : null}
        {description ? <p>{description}</p> : null}
      </div>
      {actions && <div data-slot="page-header-actions">{actions}</div>}
    </div>
  );
}
