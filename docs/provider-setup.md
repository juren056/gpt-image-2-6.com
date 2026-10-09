# Creative Studio Provider Setup

Configure secrets in **Admin → Settings → AI**. They remain server-side in the existing encrypted config store when `CONFIG_ENCRYPTION_KEY` is configured.

Required settings:

- `fal_api_key`: M01–M08, background removal, upscaling and vectorization.
- R2 account, key, secret, bucket and public domain: recommended so completed fal output is copied to durable project storage.

## Safe enablement

Two independent settings guard real calls:

1. Keep `creative_paid_models_enabled` off during code and mock testing.
2. After a model passes the approved paid test, add its exact internal ID to `creative_enabled_model_ids`, then enable the global switch.

Utility IDs are `utility-remove-background`, `utility-upscale`, and `utility-vectorize`. The global switch remains the emergency rollback: turning it off stops all new Creative Studio provider submissions without deleting tasks or assets.

## Production status

On 2026-09-12, the production Fal credential was present and the bounded live acceptance suite completed for all 18 endpoint cases. M08 edit initially exposed an incorrect `input_images` field, was corrected to Fal's documented `image_urls`, and passed a single targeted repair run. The Studio and paid-model gates were then enabled for all eight model IDs and the three utility IDs.
