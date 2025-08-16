import React from "react"
import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
interface TagsStepProps {
    control: any
}

// Default tags you want to offer
const DEFAULT_TAGS = [
    "Urgent",
    "Reefer",
    "FTL",
    "Oversized",
    "Hazmat",
    "Team",
    "Expedite",
    "LTL",
    "Dedicated"
]

export default function TagsStep({ control }: TagsStepProps) {
    return (
        <div className="space-y-4">
            <Controller
                name="tags"
                control={control}
                render={({ field }) => {
                    // State to hold the input as a string
                    const [inputValue, setInputValue] = React.useState(
                        Array.isArray(field.value) ? field.value.join(", ") : ""
                    );

                    // Keep local inputValue in sync if field.value changes externally
                    React.useEffect(() => {
                        setInputValue(Array.isArray(field.value) ? field.value.join(", ") : "");
                    }, [field.value]);

                    // On blur, update field.value as array
                    const handleBlur = () => {
                        const arr = inputValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                        field.onChange(arr);
                    };

                    // On input change, update local state only
                    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        setInputValue(e.target.value);
                    };

                    // Add a tag from the default buttons
                    const handleAddTag = (tag: string) => {
                        let tagArr = inputValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);

                        if (!tagArr.includes(tag)) {
                            tagArr = [...tagArr, tag];
                            setInputValue(tagArr.join(", "));
                            field.onChange(tagArr); // update array instantly
                        }
                    };

                    // Remove a tag
                    const handleRemoveTag = (tag: string) => {
                        let tagArr = inputValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);

                        tagArr = tagArr.filter((t) => t !== tag);
                        setInputValue(tagArr.join(", "));
                        field.onChange(tagArr);
                    };

                    // Show current tags as badges
                    const currentTags = inputValue
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean);

                    return (
                        <div>
                            {/* Default tag buttons */}
                            <div className="mb-2 flex flex-wrap gap-2">
                                {DEFAULT_TAGS.map(tag => (
                                    <Button
                                        key={tag}
                                        type="button"
                                        variant={currentTags.includes(tag) ? "secondary" : "outline"}
                                        size="sm"
                                        className="rounded-full px-3 py-1 text-xs cursor-pointer"
                                        onClick={() => handleAddTag(tag)}
                                        disabled={currentTags.includes(tag)}
                                    >
                                        {tag}
                                    </Button>
                                ))}
                            </div>
                            {/* Input */}
                            <Input
                                value={inputValue}
                                placeholder="Tags (comma separated)"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="off"
                                className="mb-2"
                            />
                            {/* Current tags as nice badges */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {currentTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center rounded-full bg-green-600 text-white px-3 py-1 text-xs font-semibold hover:scale-105 transition-all border border-green-800"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            className="ml-2 flex items-center justify-center text-white transition-colors cursor-pointer"
                                            onClick={() => handleRemoveTag(tag)}
                                            aria-label={`Remove ${tag}`}
                                        >
                                            <X size={12} strokeWidth={4} />
                                        </button>
                                    </span>

                                ))}
                            </div>
                        </div>
                    );
                }}
            />
        </div>
    )
}