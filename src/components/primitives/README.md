# Primitives

Minimal Card, Table, Badge, Alert and EmptyState components. They exist because
`@ui-sdk/react` has no equivalents.

They carry no inline styles; `src/styles/foundation.css` styles them through `data-slot` selectors. Each renders a `data-slot` attribute
(and `data-tone` for Badge/Alert), forwards `className` and all other props.

## Theming

Apps style them with CSS attribute selectors:

```css
[data-slot="card"] { border: 1px solid var(--border); border-radius: 8px; }
[data-slot="badge"] { padding: 0 .5rem; border-radius: 999px; }
[data-slot="badge"][data-tone="success"] { background: var(--green-3); }
[data-slot="alert"][data-tone="danger"] { border-color: var(--red-9); }
[data-slot="table-container"] { overflow-x: auto; }
```

## Swap point

When ui-sdk ships equivalents, replace the implementations here with re-exports
from `@ui-sdk/react/...`; pages importing from this barrel need no changes.
