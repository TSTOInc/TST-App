import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Copy from "@/components/copy"
import LinkButton from "@/components/link"
import formatPhoneNumber from "@/utils/formatPhone"

function formatTimestamp(ms) {
  const date = new Date(Math.floor(ms));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',   // Oct
    day: 'numeric',   // 7
    year: 'numeric',  // 2025
    hour: 'numeric',
    minute: 'numeric',
    hour12: true      // AM/PM
  }).format(date);
}

const Field = ({ label, value, type, inline, href, blank, external }) => {
  const link = href || value // allow href override
  const content = (
    <div className="flex items-center gap-1">
      <p>{type === "date" ? formatTimestamp(value): type === "phone" ? formatPhoneNumber(value) : value || "N/A"}</p>
      {type !== "link" && value && <Copy value={value} />}
      {type === "link" && link && <LinkButton href={link} blank={blank} external={external} />}
    </div>
  )

  return inline ? (
    <div className="flex items-center gap-2 mb-4">
      <p className="text-muted-foreground">{label}:</p>
      {content}
    </div>
  ) : (
    <div className="flex flex-col mb-4">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      {content}
    </div>
  )
}

export default function InfoCard({ CardIcon, title, fields, inline = true }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex flex-row items-center gap-2">
          {CardIcon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="ml-4 space-y-2">
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-x-6 gap-y-1">
          {fields.map((field, i) => (
            <Field
              key={i}
              label={field.label}
              value={field.value}
              type={field.type || "text"}
              href={field.href} // new override option
              blank={field.blank ?? true}
              external={field.external ?? true} 
              inline={inline}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
