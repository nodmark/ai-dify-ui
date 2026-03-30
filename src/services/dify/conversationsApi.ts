import { getDifyApiBaseUrl, getDifyApiKey, getDifyUserId } from './env';

export interface DifyConversationItem {
  id: string;
  name: string;
  inputs?: Record<string, unknown>;
  status?: string;
  introduction?: string;
  created_at?: number;
  updated_at?: number;
}

export interface DifyConversationListResponse {
  limit: number;
  has_more: boolean;
  data: DifyConversationItem[];
}

export interface ListDifyConversationsParams {
  /** 默认与 getDifyUserId() 一致 */
  user?: string;
  last_id?: string;
  /** 默认 50，最大 100 */
  limit?: number;
  /** 默认 `-updated_at` */
  sort_by?: string;
}

/**
 * 获取会话列表：`GET /v1/conversations`
 * @see https://docs.dify.ai/api-reference/conversations/list-conversations
 */
export async function listDifyConversations(
  params: ListDifyConversationsParams = {},
): Promise<DifyConversationListResponse> {
  const apiKey = getDifyApiKey();
  if (!apiKey) {
    throw new Error('未配置 VITE_DIFY_API_KEY');
  }

  const user = params.user ?? getDifyUserId();
  const search = new URLSearchParams({
    user,
    limit: String(Math.min(100, Math.max(1, params.limit ?? 50))),
    sort_by: params.sort_by ?? '-updated_at',
  });
  if (params.last_id) {
    search.set('last_id', params.last_id);
  }

  const url = `${getDifyApiBaseUrl()}/v1/conversations?${search.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<DifyConversationListResponse>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 是否为 Dify 返回的会话 UUID（本地 `new-*` 等占位 key 不能调用重命名接口） */
export function isDifyConversationId(key: string): boolean {
  return UUID_RE.test(key.trim());
}

export interface RenameDifyConversationParams {
  name: string;
  user?: string;
  /** 为 true 时由服务端自动生成标题，此时可不传 name */
  auto_generate?: boolean;
}

/**
 * 会话重命名：`POST /v1/conversations/:conversation_id/name`
 * @see https://docs.dify.ai/api-reference/conversations/conversation-rename
 */
export async function renameDifyConversation(
  conversationId: string,
  params: RenameDifyConversationParams,
): Promise<DifyConversationItem> {
  const apiKey = getDifyApiKey();
  if (!apiKey) {
    throw new Error('未配置 VITE_DIFY_API_KEY');
  }

  const user = params.user ?? getDifyUserId();
  const body: Record<string, unknown> = {
    user,
  };
  if (params.auto_generate === true) {
    body.auto_generate = true;
  } else {
    body.name = params.name;
  }

  const url = `${getDifyApiBaseUrl()}/v1/conversations/${encodeURIComponent(conversationId)}/name`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<DifyConversationItem>;
}
