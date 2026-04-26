import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface RaycastMagicLinkEmailProps {
  magicLink: string;
}

export const RaycastMagicLinkEmail = ({
  magicLink,
}: RaycastMagicLinkEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return (
    <Html>
      <Head />
      <Preview>Sign in to your account</Preview>
      <Body style={main}>
        <Container style={{
          ...container,
          backgroundImage: `url(${baseUrl}/static/raycast-bg.png)`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "100%",
        }}>
          <Heading style={h1}>Sign in to your account</Heading>
          
          <Text style={text}>
            Click the magic link below to sign in. This link expires in 24 hours and can only be used once.
          </Text>
          
          <Section style={{ textAlign: "left", marginTop: "32px", marginBottom: "32px" }}>
            <Link
              style={button}
              href={magicLink}
            >
              Sign in
            </Link>
          </Section>
          
          <Text style={text}>
            If you didn't request this email, you can safely ignore it.
          </Text>

          <Text style={footer}>
            Best,<br />
            The Candid Conversations Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default RaycastMagicLinkEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 20px 0",
};

const text = {
  color: "#444444",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const button = {
  backgroundColor: "#FF6363",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  marginTop: "48px",
};
