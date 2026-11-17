import type { ComponentPropsWithRef } from "react";

export function Table({ className, ...rest }: ComponentPropsWithRef<"table">) {
  return (
    <div data-slot="table-container">
      <table data-slot="table" className={className} {...rest} />
    </div>
  );
}
export function THead({ className, ...rest }: ComponentPropsWithRef<"thead">) {
  return <thead data-slot="table-head" className={className} {...rest} />;
}
export function TBody({ className, ...rest }: ComponentPropsWithRef<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...rest} />;
}
export function Tr({ className, ...rest }: ComponentPropsWithRef<"tr">) {
  return <tr data-slot="table-row" className={className} {...rest} />;
}
export function Th({ className, ...rest }: ComponentPropsWithRef<"th">) {
  return <th data-slot="table-header-cell" className={className} {...rest} />;
}
export function Td({ className, ...rest }: ComponentPropsWithRef<"td">) {
  return <td data-slot="table-cell" className={className} {...rest} />;
}
