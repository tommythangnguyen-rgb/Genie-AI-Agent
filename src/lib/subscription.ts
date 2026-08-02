/**
 * One place that decides whether a stored tier still grants paid access.
 *
 * `subscriptionTier` and `subscriptionStatus` are two columns that can disagree,
 * and until now only the tier was consulted. A cancellation that never landed —
 * a missed webhook, a misconfigured endpoint — left `tier=PRO, status=canceled`,
 * which every gate happily read as "Pro". Access has to be a function of both.
 *
 * Pure and synchronous so the client bundle can use it too.
 */

/** Stripe statuses that still entitle the user to their paid tier. */
const ENTITLING = new Set(["active", "trialing", "past_due"]);

/**
 * A null status means "no Stripe record either way" — a manually granted or
 * grandfathered account. Those keep their tier: failing open is right here,
 * because the alternative silently strips access from someone who paid.
 */
export function isEntitled(status: string | null | undefined): boolean {
  return status == null || status === "" || ENTITLING.has(status);
}

/**
 * The tier to actually gate on. Falls back to FREE when the subscription
 * behind it is dead, regardless of what the tier column still says.
 */
export function effectiveTier(
  tier: string | null | undefined,
  status: string | null | undefined
): string {
  const t = tier ?? "FREE";
  return isEntitled(status) ? t : "FREE";
}
