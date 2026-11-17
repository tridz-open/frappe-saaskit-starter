import type { ComponentPropsWithRef } from "react";

export type Tone = "neutral" | "success" | "warning" | "danger";
export type BadgeProps = ComponentPropsWithRef<"span"> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return <span data-slot="badge" data-tone={tone} className={className} {...rest} />;
}
