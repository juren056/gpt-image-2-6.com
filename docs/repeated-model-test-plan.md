# Repeated image test pack (not yet executed)

Prepared 2026-10-13. Existing NB-01–NB-20 remain unchanged. Their single-run
comparisons do not support a model ranking or independent-review claim.

## Nine bounded requests

Run the same two-reference brief three times on each of Nano Banana 2.1, 2 and
Pro. Submit sequentially through the site's authenticated `/api/studio/run`
endpoint. Use one output, `edit`, `1:1`, PNG and identical reference order:

1. `https://nanobanana21pro.com/images/capabilities/serum-source-20261012.webp`
2. `https://nanobanana21pro.com/images/capabilities/shoe-20261012.webp`

Exact prompt: “Place the exact ivory bottle and yellow shoe together on two
separate charcoal pedestals. Keep both objects distinct and faithful to
references.”

2.1 uses explicit 1K; 2 and Pro currently use the site's provider defaults.
Record this distinction. Check actual dimensions against 1024 × 1024; if a
provider changes size, exclude that output from size-matched comparison rather
than resize it. This is a repeatability sample of current site defaults, not a
fully controlled benchmark. Uniform explicit provider resolution across all
three models requires a separate validated pricing/provider change.

## Budget and stopping rules

Current unit site credits: 2.1 = 8, 2 = 6, Pro = 15. Three runs each total
`3 × (8 + 6 + 15) = 87` credits. Maximum nine provider requests and 100 site
credits. Recheck quotes before submitting; stop if they exceed the budget.
Provider billing is separate from site credits. No automatic retries, no paid
login/checkout tests and no replacement of failed examples. Fresh owner budget
authorization is required because the previous 20-request authorization was used.

## Review and disclosure

Keep original images, hashes, endpoint, settings, reference order, actual
dimensions, quote, deducted/refunded credits, terminal status and timing
definition. Publish failures alongside successes. Score object presence,
reference shape/label fidelity and requested staging before showing model names.
Use three reviewers only after they agree to participate; do not invent reviewers
or contact people without owner authorization. Attribute operator observations
separately from independently supplied scores. Avoid “best model” claims from
this small sample.
