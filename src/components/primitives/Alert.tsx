import type { ComponentPropsWithRef } from "react";
import type { Tone } from "./Badge";

export type AlertProps = ComponentPropsWithRef<"div"> & { tone?: Tone };

export function Alert({ tone = "neutral", className, ...rest }: AlertProps) {
  return <div role="alert" data-slot="alert" data-tone={tone} className={className} {...rest} />;
}
