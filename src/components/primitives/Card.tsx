import type { ComponentPropsWithRef } from "react";

export type CardProps = ComponentPropsWithRef<"div">;

export function Card({ className, ...rest }: CardProps) {
  return <div data-slot="card" className={className} {...rest} />;
}
export function CardHeader({ className, ...rest }: CardProps) {
  return <div data-slot="card-header" className={className} {...rest} />;
}
export function CardDescription({ className, ...rest }: ComponentPropsWithRef<"p">) {
  return <p data-slot="card-description" className={className} {...rest} />;
}
export function CardBody({ className, ...rest }: CardProps) {
  return <div data-slot="card-body" className={className} {...rest} />;
}
export const CardContent = CardBody;
export function CardFooter({ className, ...rest }: CardProps) {
  return <div data-slot="card-footer" className={className} {...rest} />;
}
