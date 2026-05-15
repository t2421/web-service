import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  url: string;
}

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>サインインリンクをクリックしてアクセス</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>サインイン</Heading>
          <Text style={text}>
            下のボタンをクリックしてアプリにサインインしてください。リンクの有効期限は 24 時間です。
          </Text>
          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Button style={button} href={url}>
              サインインする
            </Button>
          </Section>
          <Text style={muted}>
            このメールに心当たりがない場合は、このメッセージを無視してください。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default MagicLinkEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "560px",
};

const h1 = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const text = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "22px",
};

const muted = {
  color: "#94a3b8",
  fontSize: "12px",
  marginTop: "24px",
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 20px",
};
