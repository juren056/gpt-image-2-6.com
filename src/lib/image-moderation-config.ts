/** A saved key alone must not override an administrator's explicit opt-out. */
export function imageModerationConfig(configs: Record<string, string>) {
  return {
    apiKey:
      configs.content_safety_openai_enabled === 'false'
        ? ''
        : configs.openai_api_key || '',
    baseUrl: configs.openai_base_url || 'https://api.openai.com/v1',
    model: configs.content_safety_openai_model || 'omni-moderation-latest',
    seeapi: seeapiModerationConfig(configs),
  };
}

export function seeapiModerationConfig(configs: Record<string, string>) {
  const apiKey = configs.seeapi_api_key?.trim();
  if (!apiKey || configs.content_safety_seeapi_enabled === 'false')
    return undefined;
  return {
    apiKey,
    thresholdOffset: Number(configs.seeapi_threshold_offset?.trim() || '0.02'),
    strictSpecialCare: configs.seeapi_strict_special_care !== 'false',
  };
}

export function validateImageModerationSettings(
  configs: Record<string, string>
) {
  for (const key of [
    'content_safety_seeapi_enabled',
    'seeapi_strict_special_care',
  ]) {
    const value = configs[key];
    if (value !== undefined && value !== 'true' && value !== 'false') {
      throw new Error(`${key} must be true or false`);
    }
  }
  if (configs.seeapi_threshold_offset?.trim()) {
    const offset = Number(configs.seeapi_threshold_offset);
    if (
      !Number.isFinite(offset) ||
      offset < 0 ||
      offset > 0.1 ||
      Math.abs(offset * 100 - Math.round(offset * 100)) > 1e-8
    ) {
      throw new Error(
        'SeeAPI threshold offset must be 0–0.10 in steps of 0.01'
      );
    }
  }
  const enabled = configs.content_safety_openai_enabled;
  if (enabled !== undefined && enabled !== 'true' && enabled !== 'false') {
    throw new Error('OpenAI image review must be true or false');
  }
  const address = configs.openai_base_url;
  if (!address?.trim()) return;
  try {
    const url = new URL(address);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error('Invalid endpoint');
    }
  } catch {
    throw new Error(
      'OpenAI Base URL must be an HTTPS API address, such as https://api.openai.com/v1, not an email or API key'
    );
  }
}
