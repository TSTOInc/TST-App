import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RateConfirmationPage({ params }) {
  const { loadId } = params;

  return (
    <div className="flex justify-center pt-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Rate Confirmation</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="space-y-4">
            <input type="hidden" name="loadId" value={loadId} />
            <input
              type="hidden"
              name="category"
              value="RATE_CONFIRMATION"
            />

            <div className="space-y-2">
              <Label htmlFor="file">Rate Confirmation File</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".pdf,.jpg,.png"
                required
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PDF, JPG, PNG (max 10MB)
              </p>
            </div>

            <Button type="submit" className="w-full">
              Upload Document
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
