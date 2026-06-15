export function extractLinks(text: string): { cleanText: string; urls: string[] } {
  const urlRegex = /https?:\/\/[^\s]+/g
  const found = text.match(urlRegex) ?? []
  const cleanText = text
    .replace(urlRegex, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { cleanText, urls: found.slice(0, 3) }
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.length > 40 ? url.slice(0, 40) + '…' : url
  }
}
