import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { X } from "lucide-react";

type AddTagsModalProps = {
  ghlTags: { id: string; name: string; locationId: string }[];
  editing: boolean;
  setTag: React.Dispatch<React.SetStateAction<string>>;
  tag: string;
  setNewTag: React.Dispatch<React.SetStateAction<string>>;
  handleAddTag: () => void;
  newTag: string;
  handleDeleteTag: () => void;
};

export default function AddTagsModal({
  ghlTags,
  editing,
  setTag,
  tag,
  setNewTag,
  handleAddTag,
  newTag,
  handleDeleteTag,
}: AddTagsModalProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "Add" : "Active"} Tag</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Input for creating/searching tags */}
        {editing && (
          <input
            type="text"
            value={newTag}
            placeholder="Search / create tag"
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {/* Autocomplete Suggestions */}
        {editing && newTag && (
          <div className="border rounded-lg shadow bg-white max-h-40 overflow-y-auto mb-3 dark:bg-[#171717]">
            {ghlTags
              .filter((t) =>
                t.name.toLowerCase().includes(newTag.toLowerCase())
              )
              .map((t) => (
                <div
                  key={t.id}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-blue-500 dark:hover:bg-[#171717]"
                  onClick={() => {
                    setTag(t.name);
                    setNewTag("");
                  }}
                >
                  {t.name}
                </div>
              ))}

            {/* Create new tag option */}
            {!ghlTags.some(
              (t) => t.name.toLowerCase() === newTag.toLowerCase()
            ) && (
              <div
                className="bg-blue-50 cursor-pointer dark:bg-[#171717] hover:bg-blue-100 px-3 py-2 text-blue-600"
                onClick={handleAddTag}
              >
                ➕ Create "{newTag}"
              </div>
            )}
          </div>
        )}

        {/* Show selected tag */}
        {tag && (
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant="default"
              className="justify-between"
              // onClick={handleDeleteTag}
            >
              {tag}
              {editing && (
                <X
                  className="w-4 h-4 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTag();
                  }}
                />
              )}
            </Button>
          </div>
        )}

        {/* Dropdown for GHL tags */}
        {editing && (
          <>
            <p className="text-sm text-gray-600">LeadConnector Tags</p>
            <Select
              onValueChange={(selected) => {
                if (selected) {
                  setTag(selected);
                }
              }}
            >
              <SelectTrigger className="w-full mb-4">
                <SelectValue placeholder="Please select a tag" />
              </SelectTrigger>

              <SelectContent>
                {ghlTags?.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </CardContent>
    </Card>
  );
}
