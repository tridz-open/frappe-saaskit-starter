import { Badge } from "./Badge";

/** Small marker for features that are in the alpha but not yet verified against a live backend. */
export function ExperimentalBadge() {
  return <Badge tone="warning" data-testid="experimental-badge" title="Not yet verified against a live backend">Experimental</Badge>;
}
