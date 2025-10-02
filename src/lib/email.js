"use server"

import { Resend } from "resend";
import InvoiceEmail from "@/components/emails/invoice-template";
import mapLoadToInvoicePayload from '@/lib/mapLoadToInvoicePayload';

const resend = new Resend(process.env.RESEND_API_KEY);

export const send = async (emailFormData) => {
    try {
        // 1. Generate invoice PDF
        const payload = mapLoadToInvoicePayload(emailFormData);

        const res = await fetch("https://invoice4all.vercel.app/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to generate invoice PDF");

        const buffer = await res.arrayBuffer();
        const base64Invoice = Buffer.from(buffer).toString("base64");

        // 2. Map docs
        const docAttachments = (emailFormData.docs || []).map((docUrl) => ({
            path: docUrl,
            filename: decodeURIComponent(docUrl.split("/").pop() || "document.pdf"),
        }));

        // 3. Final attachments
        const attachments = [
            ...docAttachments,
            {
                filename: `Invoice-${emailFormData.invoice_number}.pdf`,
                content: base64Invoice,
            },
            {
                path: "https://bxporjcib7gy7ljf.public.blob.vercel-storage.com/company/VOID%20CHECK.pdf",
                filename: "VOID CHECK.pdf",
            },
            {
                path: "https://bxporjcib7gy7ljf.public.blob.vercel-storage.com/company/Bank%20Information%20Three%20Stars%20Transport%20Inc.pdf",
                filename: "Bank Information Three Stars Transport Inc.pdf",
            },
        ];

        // 4. Send email
        const { data, error } = await resend.emails.send({
            from: "contact@yeetco.shop",
            to: ["threestars039@gmail.com"],
            bcc: ["contact@yeetco.shop"],
            subject: `Invoice${emailFormData.payment_terms.is_quickpay ? ` (${emailFormData.payment_terms.name})` : ""} #${emailFormData.invoice_number} - Load #${emailFormData.load_number} | Three Stars Transport Inc.`,
            react: InvoiceEmail({
                brokerName: emailFormData.broker.name,
                loadNumber: emailFormData.load_number,
                amountDue: emailFormData.rate,
                dueDays: emailFormData.payment_terms.days_to_pay,
                payment_terms: emailFormData.payment_terms,
            }),
            attachments,
        });

        if (error) {
            throw new Error(error.message || "Failed to send email");
        }

        return data;
    } catch (err) {
        console.error("Form submission error", err);
        throw err;
    }
};
