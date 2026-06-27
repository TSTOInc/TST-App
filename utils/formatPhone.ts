export default function formatPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")

  if (digits.length === 11 && digits.startsWith("1")) {
    // US number: 1 + 10 digits → format without country code
    return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
  } else {
    // Other countries: separate country code (assume 1-3 digits) + rest
    // We'll take everything before last 10 digits as country code
    const local = digits.slice(-10)
    const countryCode = digits.slice(0, -10)
    return countryCode
      ? `+${countryCode} (${local.slice(0,3)}) ${local.slice(3,6)}-${local.slice(6)}`
      : `(${local.slice(0,3)}) ${local.slice(3,6)}-${local.slice(6)}`
  }
}
