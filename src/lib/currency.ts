const USD_FORMATTER = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  /**
   * Converts a database integer (cents) into a formatted USD string.
   * @example formatCentsToUSD(250000) -> "$2,500.00"
   * @example formatCentsToUSD(7550)   -> "$75.50"
   */
  export function formatCentsToUSD(cents: number | string | undefined | null): string {
    const numericCents = typeof cents === "string" ? Number(cents) : cents;
    
    if (numericCents === undefined || numericCents === null || isNaN(numericCents)) {
      return USD_FORMATTER.format(0);
    }
    
    return USD_FORMATTER.format(numericCents / 100);
  }
  
  /**
   * Safely converts a user-facing string or float dollar amount into database cents.
   * Employs Math.round to negate float precision artifacts.
   * @example toCents("1500.50") -> 150050
   * @example toCents(75.25)     -> 7525
   */
  export function toCents(dollars: string | number | undefined | null): number {
    if (dollars === undefined || dollars === null) return 0;
    
    const parsed = typeof dollars === "string" ? parseFloat(dollars) : dollars;
    if (isNaN(parsed)) return 0;
    
    return Math.round(parsed * 100);
  }
  
  /**
   * Combines a base rate and a list of dynamic adjustments (in cents) to calculate totals.
   */
  export function calculateLoadFinancials(
    baseRateCents: number,
    feePercent: number,
    adjustments: Array<{ type: string; amount: number }> = []
  ) {
    // Base linehaul
    const rate = Math.round(Number(baseRateCents)) || 0;
  
    // Additions (Lumper, detention, etc.)
    const additions = adjustments
      .filter((adj) => ["lumper", "detention", "layover", "tarp_fee", "custom_fee"].includes(adj.type))
      .reduce((sum, adj) => sum + adj.amount, 0);
  
    // Deductions (Fuel advances, manual discounts)
    const deductions = adjustments
      .filter((adj) => ["fuel_advance", "discount"].includes(adj.type))
      .reduce((sum, adj) => sum + adj.amount, 0);
  
    // Quickpay Fee calculation based on the Base Linehaul Rate
    const quickPayFee = Math.round(rate * (feePercent / 100));
  
    // Gross invoice total sent to broker
    const grossInvoiceTotal = rate + additions;
  
    // Final net payout to carrier
    const netPayout = grossInvoiceTotal - deductions - quickPayFee;
  
    return {
      baseRateCents: rate,
      quickPayFeeCents: quickPayFee,
      totalAdditionsCents: additions,
      totalDeductionsCents: deductions,
      grossInvoiceTotalCents: grossInvoiceTotal,
      netRateCents: netPayout,
    };
  }