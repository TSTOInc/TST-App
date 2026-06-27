import { IconMessageCircle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Page() {
  return (
    <Empty className="from-background to-primary/10 bg-gradient-to-b from-30% h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconMessageCircle/>
        </EmptyMedia>
        <EmptyTitle>Your Messages</EmptyTitle>
        <EmptyDescription>
          Send a message to start a chat.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          Send message
        </Button>
      </EmptyContent>
    </Empty>
  )
}
