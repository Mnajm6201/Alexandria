// components/bookclub/discussions/DiscussionItem.tsx
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare } from 'lucide-react';

interface DiscussionItemProps {
  post: any;
  clubId: string;
  formatDate: (date: string) => string;
}

export function DiscussionItem({ post, clubId, formatDate }: DiscussionItemProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-white p-4 transition-all hover:border-amber-300 hover:shadow-sm">
      <div className="flex gap-4">
        <div className="hidden sm:block">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-amber-200">
            <div className="flex h-full w-full items-center justify-center bg-amber-200 text-amber-800">
              {(post.username || post.author || "User").substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <Link
            href={`/club/${clubId}/post/${post.id}`}
            className="font-medium text-amber-900 hover:underline"
          >
            {post.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-amber-700">
            <span>Started by {post.username || post.author || "User"}</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.created_on || post.date)}
            </span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post.comment_count || post.replies || 0} replies
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end justify-between text-right">
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-800 border-amber-200"
          >
            Active
          </Badge>
          <div className="text-xs text-amber-700">
            {post.lastActivity || "recently"}
          </div>
        </div>
      </div>
    </div>
  );
}