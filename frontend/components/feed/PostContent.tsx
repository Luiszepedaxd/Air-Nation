'use client'

import { parseContentWithMentions } from '@/app/dashboard/FeedHome'
import { LinkChip } from '@/components/feed/LinkChip'
import { extractLinks } from '@/lib/parse-links'

const lato = { fontFamily: "'Lato', sans-serif" }

export function PostContent({
  content,
  mentionIds,
  mentionAliasById,
  className,
}: {
  content: string | null
  mentionIds?: string[] | null
  mentionAliasById?: Record<string, string> | null
  className?: string
}) {
  const { cleanText, urls } = extractLinks(content ?? '')
  if (!cleanText && urls.length === 0) return null

  return (
    <div className={className}>
      {cleanText && (
        <p
          style={{ ...lato, overflowWrap: 'anywhere', wordBreak: 'break-word' }}
          className="text-[14px] text-[#111111] leading-relaxed"
        >
          {parseContentWithMentions(cleanText, mentionIds ?? null, mentionAliasById ?? null)}
        </p>
      )}
      {urls.map((url, i) => (
        <LinkChip key={i} url={url} />
      ))}
    </div>
  )
}
