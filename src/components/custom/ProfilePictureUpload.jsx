import React, { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";


export default function ProfilePictureUpload({ onChange }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // optional callback to parent
      if (onChange) onChange(file);

      // internal preview
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {!preview ? (
        <span className="text-neutral-400 w-1/4 min-w-[200px] aspect-square rounded-full border flex items-center justify-center bg-neutral-900">
          No picture attached
        </span>
      ) : (
        <div className="w-1/4 min-w-[200px] aspect-square rounded-full overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover border-2 border-neutral-600 rounded-full"
          />
        </div>
      )}

      <Input
        id="picture"
        type="file"
        accept="image/*"
        className="w-1/4 min-w-[250px] h-[2.5rem]"
        onChange={handleFileChange}
      />
    </div>
  );
}
