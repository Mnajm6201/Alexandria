import { Button } from "@/components/ui/button";

interface AnnouncementsPanelProps {
  announcements: any[];
  formatDate: (date: string) => string;
}

export function AnnouncementsPanel({
  announcements,
  formatDate,
}: AnnouncementsPanelProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-medium text-amber-900">Announcements</h3>
      {announcements.length > 0 ? (
        <>
          {announcements.slice(0, 3).map((announcement: any) => (
            <div
              key={announcement.id}
              className="mb-4 rounded-lg bg-amber-50 p-4"
            >
              <h4 className="font-medium text-amber-900">
                {announcement.title}
              </h4>
              <p className="mt-1 text-sm text-amber-800">
                {announcement.content}
              </p>
              <p className="mt-2 text-xs text-amber-700">
                {formatDate(announcement.created_on || announcement.date)}
              </p>
            </div>
          ))}
          {announcements.length > 3 && (
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full border-amber-300 text-amber-800"
              >
                View All Announcements
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="text-amber-700 text-center">No announcements yet.</p>
      )}
    </div>
  );
}
