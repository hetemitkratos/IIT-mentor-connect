import {
  Html,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Link,
  Hr,
} from "@react-email/components"

export default function BookingEmail({
  studentName,
  mentorName,
  date,
  time,
  meetLink,
}: {
  studentName: string
  mentorName: string
  date: string
  time: string
  meetLink?: string | null
}) {
  return (
    <Html>
      <Body style={{ fontFamily: "sans-serif", background: "#f9fafb" }}>
        <Container style={{ background: "#fff", padding: "32px 24px", borderRadius: 12, border: "1px solid #e5e7eb", margin: "40px auto", maxWidth: "600px" }}>
          <Heading style={{ color: "#1a1c1c", fontSize: "24px", marginTop: 0, marginBottom: "24px" }}>
            Your session with {mentorName} is confirmed 🎉
          </Heading>

          <Text style={{ color: "#585f6c", fontSize: "16px", lineHeight: "1.5" }}>
            Hi {studentName},
          </Text>

          <Text style={{ color: "#585f6c", fontSize: "16px", lineHeight: "1.5" }}>
            Your booking is locked in. We've notified {mentorName} and set up everything for your session.
          </Text>

          <Section style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", marginTop: "24px", marginBottom: "24px" }}>
            <Text style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
              <span style={{ color: "#9ca3af", marginRight: "12px", display: "inline-block", width: "100px" }}>Mentor</span>
              <strong style={{ color: "#1a1c1c" }}>{mentorName}</strong>
            </Text>
            <Text style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
              <span style={{ color: "#9ca3af", marginRight: "12px", display: "inline-block", width: "100px" }}>Date</span>
              <strong style={{ color: "#1a1c1c" }}>{date}</strong>
            </Text>
            <Text style={{ margin: 0, fontSize: "14px" }}>
              <span style={{ color: "#9ca3af", marginRight: "12px", display: "inline-block", width: "100px" }}>Time</span>
              <strong style={{ color: "#1a1c1c" }}>{time} (IST)</strong>
            </Text>
          </Section>

          {meetLink ? (
            <Link
              href={meetLink}
              style={{
                background: "#f5820a",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "8px",
                display: "inline-block",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "15px",
                textAlign: "center"
              }}
            >
              Join Google Meet
            </Link>
          ) : (
             <Text style={{ 
               background: "#f5f5f5", 
               padding: "16px", 
               borderRadius: "8px", 
               color: "#52525b", 
               fontSize: "14px", 
               margin: 0
             }}>
               Your meeting link is being prepared. It will be emailed to you shortly and will be available on your dashboard.
             </Text>
          )}

          <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0" }} />

          <Text style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
            You will receive a reminder email 30 minutes before your session begins.<br/>
            Best regards,<br/>The Candid Conversations Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
