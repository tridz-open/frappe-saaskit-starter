import type { ComponentPropsWithRef } from "react";

export function Skeleton({ width, height, style, ...rest }: ComponentPropsWithRef<"span"> & { width?: string; height?: string }) {
  return <span data-slot="skeleton" aria-hidden="true" style={{ width, height, ...style }} {...rest} />;
}
