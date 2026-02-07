import { DialogDemo } from "@/components/data/upload/upload-doc";

export default function RateConfirmationPage() {

  return (
    <div className="flex justify-center pt-10">
      <DialogDemo title="File Upload" multiple={true} category="CDL" entityType="drivers" entityId="123" expires={true} />
    </div>
  );
}
