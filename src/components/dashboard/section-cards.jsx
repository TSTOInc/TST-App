import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"




function getTrend(current, previous) {
  if (previous === 0) return { percent: 100, trend: "up" };
  const diff = ((current - previous) / previous) * 100;
  return {
    percent: Math.abs(Number(diff.toFixed(1))),
    trend: diff >= 0 ? "up" : "down",
  };
}

export function SectionCards({ stats }) {
  const currentRevenue = Number(stats.last30Days.revenue.replace(/[^0-9.-]+/g, ""));
  const previousRevenue = Number(stats.prev30Days.revenue.replace(/[^0-9.-]+/g, ""));
  const revenueTrend = getTrend(currentRevenue, previousRevenue);

  const currentLoads = stats.last30Days.loads;
  const previousLoads = stats.prev30Days.loads;
  const loadsTrend = getTrend(currentLoads, previousLoads);

  const currentBrokers = stats.last30Days.brokers;
  const previousBrokers = stats.prev30Days.brokers;
  const brokersTrend = getTrend(currentBrokers, previousBrokers);
  
  const currentMiles = "2";
  const previousMiles = "1";
  const milesTrend = getTrend(currentMiles, previousMiles);

  return (
<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      
      {/* Revenue */}
      <Card className="@container/card hover:border-primary transition-colors">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.last30Days.revenue}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {revenueTrend.trend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {revenueTrend.trend === "up" ? "+" : "-"}
              {revenueTrend.percent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {revenueTrend.trend === "up" ? "Trending up" : "Trending down"} this period
            {revenueTrend.trend === "up" ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Compared to previous 30 days
          </div>
        </CardFooter>
      </Card>

      {/* Loads */}
      <Card className="@container/card hover:border-primary transition-colors">
        <CardHeader>
          <CardDescription>Total Loads</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.last30Days.loads}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {loadsTrend.trend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {loadsTrend.trend === "up" ? "+" : "-"}
              {loadsTrend.percent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {loadsTrend.trend === "up" ? "More loads moved" : "Fewer loads moved"}
          </div>
          <div className="text-muted-foreground">
            Compared to previous 30 days
          </div>
        </CardFooter>
      </Card>

      {/* Brokers */}
      <Card className="@container/card hover:border-primary transition-colors @xl/main:col-span-2 @5xl/main:col-span-1">
        <CardHeader>
          <CardDescription>New Brokers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.last30Days.brokers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {brokersTrend.trend === "up" ? <IconTrendingUp /> : <IconTrendingDown />}
              {brokersTrend.trend === "up" ? "+" : "-"}
              {brokersTrend.percent}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {brokersTrend.trend === "up"
              ? "More brokers onboarded"
              : "Fewer brokers onboarded"}
          </div>
          <div className="text-muted-foreground">
            Compared to  previous 30 days
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
