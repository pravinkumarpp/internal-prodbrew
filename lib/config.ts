export const AUTOMATION_ENGINE_URL =
  process.env.AUTOMATION_ENGINE_URL ?? "http://localhost:3001/automation";

export const FIZZY_BASE_URL =
  process.env.FIZZY_BASE_URL ?? "https://app.fizzy.do";

export function getFizzyCardCreateUrl(accountId: string, boardId: string): string {
  return `${FIZZY_BASE_URL}/${accountId}/boards/${boardId}/cards`;
}
