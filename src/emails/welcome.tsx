import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{name} さん、ようこそ</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f6f9fc" }}>
        <Container style={{ margin: "0 auto", padding: "32px", width: "560px" }}>
          <Heading style={{ color: "#0f172a", fontSize: "24px" }}>ようこそ、{name} さん</Heading>
          <Text style={{ color: "#334155", fontSize: "14px", lineHeight: "22px" }}>
            アカウント作成ありがとうございます。すぐに使い始められます。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
