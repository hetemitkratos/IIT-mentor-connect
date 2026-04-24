import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Link,
} from "@react-email/components"

export default function SessionReminderEmail({
  studentName,
  mentorName,
  time,
  meetLink,
}: {
  studentName: string
  mentorName: string
  time: string
  meetLink?: string | null
}) {
  return (
    <Html>
      <Body style={{ fontFamily: "sans-serif", background: "#f9fafb" }}>
        <Container style={{ background: "#fff", padding: 20, borderRadius: 8 }}>
          <Heading>⏰ Your session starts soon</Heading>

          <Text>Hi {studentName},</Text>

          <Text>
            Your session with <strong>{mentorName}</strong> starts in 30 minutes.
          </Text>

          <Section>
            <Text>⏰ {time}</Text>
          </Section>

          {meetLink && (
            <Link
              href={meetLink}
              style={{
                background: "#f5820a",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: "6px",
                display: "inline-block",
                marginTop: "12px",
                textDecoration: "none"
              }}
            >
              Join Meeting
            </Link>
          )}
        </Container>
      </Body>
    </Html>
  )
}
