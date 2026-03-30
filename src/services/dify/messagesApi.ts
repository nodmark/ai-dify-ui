import type { DefaultMessageInfo, XModelMessage } from '@ant-design/x-sdk';
import { getDifyApiBaseUrl, getDifyApiKey, getDifyUserId } from './env';

/** 单条会话历史记录（与 Dify 返回字段对齐） */
export interface DifyHistoryMessageItem {
  id: string;
  conversation_id: string;
  /** 用户输入 / 提问 */
  query: string;
  /** 助手回复 */
  answer: string;
  created_at?: number;
  feedback?: unknown;
  retriever_resources?: unknown;
  inputs?: Record<string, unknown>;
}

export interface DifyMessagesListResponse {
  limit: number;
  has_more: boolean;
  data: DifyHistoryMessageItem[];
}

export interface ListDifyMessagesParams {
  conversation_id: string;
  user?: string;
  /** 默认 50，范围 1–100 */
  limit?: number;
  /** 分页：当前页最早一条消息的 id，用于拉取更早消息 */
  first_id?: string;
}

/**
 * 将 Dify 历史记录行转为 useXChat 所需的 defaultMessages（每条含 query + answer 各一轮）。
 * `rows` 建议已按时间正序（旧 → 新）。
 */
export function mapDifyHistoryRowsToDefaultMessages(
  rows: DifyHistoryMessageItem[],
): DefaultMessageInfo<XModelMessage>[] {
  const out: DefaultMessageInfo<XModelMessage>[] = [];
  for (const row of rows) {
    const q = row.query?.trim();
    const a = row.answer?.trim();
    if (q) {
      out.push({ message: { role: 'user', content: q }, status: 'success' });
    }
    if (a) {
      out.push({ message: { role: 'assistant', content: a }, status: 'success' });
    }
  }
  return out;
}

/**
 * 获取会话历史消息：`GET /v1/messages`
 * 返回顺序一般为**新消息在前**，展示前需按时间正序排列（通常对 `data` 做 reverse）。
 * @see https://docs.dify.ai/api-reference/conversations/get-conversation-history-messages
 */
export async function listDifyConversationMessages(
  params: ListDifyMessagesParams,
): Promise<DifyMessagesListResponse> {
  const apiKey = getDifyApiKey();
  if (!apiKey) {
    throw new Error('未配置 VITE_DIFY_API_KEY');
  }

  const user = params.user ?? getDifyUserId();
  const search = new URLSearchParams({
    conversation_id: params.conversation_id,
    user,
    limit: String(Math.min(100, Math.max(1, params.limit ?? 50))),
  });
  if (params.first_id) {
    search.set('first_id', params.first_id);
  }

  const url = `${getDifyApiBaseUrl()}/v1/messages?${search.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<DifyMessagesListResponse>;
}
