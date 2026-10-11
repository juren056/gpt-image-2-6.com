/** A saved key alone must not override an administrator's explicit opt-out. */
export function imageModerationConfig(configs: Record<string, string>) {
  return {
    apiKey:
      configs.content_safety_openai_enabled === 'false'
        ? ''
        : configs.openai_api_key || '',
    baseUrl: configs.openai_base_url || 'https://api.openai.com/v1',
    model: configs.content_safety_openai_model || 'omni-moderation-latest',
  };
}

export function validateImageModerationSettings(
  configs: Record<string, string>
) {
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
