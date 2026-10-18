/** Owner-approved methods: password, Google OAuth and Google One Tap. */
export function applySiteAuthPolicy(
  configs: Record<string, string>
): Record<string, string> {
  return {
    ...configs,
    github_auth_enabled: 'false',
    email_otp_sign_in_enabled: 'false',
    email_verification_enabled: 'false',
  };
}

export const SITE_ACCOUNT_LINKING = {
  enabled: true,
  allowDifferentEmails: false,
  updateUserInfoOnLink: false,
  disableImplicitLinking: true,
} as const;
