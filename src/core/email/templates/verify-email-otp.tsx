import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export function VerifyEmailOTP({
  appName = 'our app',
  logoUrl,
  otp,
  purpose = 'email-verification',
}: {
  appName?: string;
  logoUrl?: string;
  otp: string;
  purpose?: 'email-verification' | 'sign-in';
}) {
  const isSignIn = purpose === 'sign-in';
  const title = isSignIn ? `Sign in to ${appName}` : 'Verify your email';
  const preview = `${otp} is your ${appName} ${isSignIn ? 'sign-in' : 'verification'} code`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Section style={styles.accentBar} />
            <Section style={styles.brandRow}>
              {logoUrl ? (
                <Img
                  src={logoUrl}
                  width="40"
                  height="40"
                  alt={appName}
                  style={styles.logo}
                />
              ) : null}
              <Text style={styles.brand}>{appName}</Text>
            </Section>
            <Heading style={styles.heading}>{title}</Heading>
            <Text style={styles.paragraph}>
              {isSignIn
                ? 'Enter this six-digit code on the sign-in page to continue securely.'
                : 'Enter this six-digit code on the verification page to finish creating your account.'}
            </Text>
            <Section style={styles.codeWrap}>
              <Text style={styles.code}>{otp}</Text>
            </Section>
            <Text style={styles.muted}>
              This code expires in 10 minutes and can only be used once.
            </Text>
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              If you did not request this code, you can safely ignore this
              email. Never share this code with anyone.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: '#f6f9fc',
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,Helvetica,Arial,sans-serif',
    color: '#0f172a',
  },
  container: { maxWidth: 560, margin: '0 auto', padding: '32px 16px 40px' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '28px 24px',
    border: '1px solid rgba(15,23,42,.08)',
  },
  accentBar: {
    height: 6,
    borderRadius: 999,
    marginBottom: 18,
    background: 'linear-gradient(90deg,#6366f1 0%,#ec4899 55%,#0ea5e9 100%)',
  },
  brandRow: { display: 'flex', alignItems: 'center', marginBottom: 16 },
  logo: { borderRadius: 10, marginRight: 10 },
  brand: { margin: 0, fontSize: 14, lineHeight: '40px', fontWeight: 600 },
  heading: {
    margin: '0 0 10px',
    fontSize: 24,
    lineHeight: '30px',
    fontWeight: 700,
  },
  paragraph: {
    margin: '0 0 18px',
    fontSize: 14,
    lineHeight: '22px',
    color: '#334155',
  },
  codeWrap: {
    margin: '20px 0',
    padding: '18px 12px',
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    textAlign: 'center',
  },
  code: {
    margin: 0,
    fontSize: 36,
    lineHeight: '44px',
    fontWeight: 700,
    letterSpacing: '10px',
    color: '#5b21b6',
  },
  muted: {
    margin: '0 0 10px',
    fontSize: 12,
    lineHeight: '18px',
    color: '#64748b',
    textAlign: 'center',
  },
  hr: { borderColor: 'rgba(15,23,42,.08)', margin: '18px 0' },
  footer: { margin: 0, fontSize: 12, lineHeight: '18px', color: '#94a3b8' },
};
