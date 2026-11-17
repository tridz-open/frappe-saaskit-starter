import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";

type Div = ComponentPropsWithRef<"div">;
/** Centered max-width wrapper (--container-max). */
export function Container(props: Div) { return <div data-slot="container" {...props} />; }
/** Vertical stack; gap via --stack-gap. */
export function Stack({ gap, style, ...rest }: Div & { gap?: string }) {
  return <div data-slot="stack" style={{ ...(gap ? { ["--stack-gap" as string]: gap } : {}), ...style } as CSSProperties} {...rest} />;
}
/** Horizontal wrapping row. */
export function Row(props: Div) { return <div data-slot="row" {...props} />; }
/** Responsive auto-fit grid; min column width via --grid-min. */
export function Grid({ min, style, ...rest }: Div & { min?: string }) {
  return <div data-slot="grid" style={{ ...(min ? { ["--grid-min" as string]: min } : {}), ...style } as CSSProperties} {...rest} />;
}
/** Page section with vertical padding and optional centered header. */
export function Section({ title, description, eyebrow, align, children, ...rest }: Omit<ComponentPropsWithRef<"section">, "title"> & { title?: ReactNode; description?: ReactNode; eyebrow?: ReactNode; align?: "center" }) {
  return (
    <section data-slot="section" {...rest}>
      {title || description ? (
        <div data-slot="section-header" data-align={align}>
          {eyebrow ? <p data-slot="eyebrow">{eyebrow}</p> : null}
          {title ? <h2>{title}</h2> : null}
          {description ? <p data-slot="lead">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
