"use client";

export function GeneralSection({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  scheduledAt,
  onScheduledAtChange,
}: {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-white">General settings</h2>
        <p className="mt-1 text-sm text-gray-400">Name and describe this lobby, and optionally schedule when it opens.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-100" htmlFor="lobby-name">
          Lobby name
        </label>
        <input
          id="lobby-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={60}
          placeholder="e.g. Friday Night Draft"
          className="rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-sm text-gray-100 outline-none focus:border-squad-accent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-100" htmlFor="lobby-description">
          Description
        </label>
        <textarea
          id="lobby-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Optional notes for whoever joins — rules, vibe, whatever."
          className="resize-none rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-sm text-gray-100 outline-none focus:border-squad-accent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-100" htmlFor="lobby-scheduled-at">
          Opens at
        </label>
        <p className="text-xs text-gray-500">Leave blank to open the lobby immediately.</p>
        <input
          id="lobby-scheduled-at"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => onScheduledAtChange(e.target.value)}
          className="rounded-lg border border-squad-border bg-squad-panel px-3 py-2 text-sm text-gray-100 outline-none focus:border-squad-accent"
        />
      </div>
    </div>
  );
}
