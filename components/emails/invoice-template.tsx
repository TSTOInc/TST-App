// components/emails/InvoiceEmail.tsx
import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface InvoiceEmailProps {
  brokerName: string;
  loadNumber: string;
  amountDue: string;
  payment_terms?: {
    name: string;
    is_quickpay: boolean;
    percentage: number; // e.g. 3 for 3%
    days: number; // e.g. 2 for 2-day quick pay
  };
}

export default function InvoiceEmail({
  brokerName,
  loadNumber,
  amountDue,
  payment_terms,
}: InvoiceEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Invoice submission for Load #{loadNumber}</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f9f9f9" }}>
        <Container
          style={{
            backgroundColor: "#fff",
            margin: "20px auto",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "600px",
          }}
        >
          <Section>
            <Text style={{ fontSize: "18px", fontWeight: "bold" }}>
              Three Stars Transport Inc.
            </Text>
            <Text>Dear {brokerName},</Text>
            <Text>
              Please find attached the payment documents for{" "}
              <strong>Load #{loadNumber}</strong>.
            </Text>
            <Text>The following documents are included:</Text>
            <ul>
              <li>Rate Confirmation</li>
              <li>Proof of Delivery (POD)</li>
              <li>Invoice</li>
              <li>VOID Check</li>
              <li>Banking Information (PDF)</li>
            </ul>

            <Hr />

            <Text style={{ fontSize: "16px", fontWeight: "bold" }}>
              Payment Details
            </Text>
            <Text>
              Total Amount Due: <strong>
                {payment_terms && typeof payment_terms.percentage === "number"
                  ? (() => {
                      const amount = parseFloat(amountDue.replace(/[^0-9.-]+/g,""));
                      const discount = amount * (payment_terms.percentage / 100);
                      const finalAmount = amount - discount;
                      return `${amountDue} - ${discount.toFixed(2)} = ${finalAmount.toFixed(2)}`;
                    })()
                  : amountDue}
              </strong>
            </Text>
            
            <Text>
              Payment Terms: <strong>{payment_terms?.name}</strong>
            </Text>

            <Hr />

            <Text>
              We kindly request that payment is made within the agreed terms.  
              If you have any questions or require additional information, please
              reach out to our billing department at{" "}
              <a href="mailto:billing@tstransportinc.com">
                billing@tstransportinc.com
              </a>{" "}
              or call (619) 939-6319.
            </Text>

            <Text>Thank you for your business,</Text>
            <Text>
              <strong>Accounts Receivable</strong> | 
              Three Stars Transport Inc.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
