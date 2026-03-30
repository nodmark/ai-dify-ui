import {
  AbstractChatProvider,
  type SSEFields,
  type TransformMessage,
  type XModelMessage,
  type XModelParams,
  type XRequestOptions,
} from '@ant-design/x-sdk';

type DifySSEChunk = Partial<Record<SSEFields, string>>;

interface DifyStreamPayload {
  event?: string;
  answer?: string;
  conversation_id?: string;
  message?: string;
}

function getUserContent(msg: XModelMessage | undefined): string {
  if (!msg) return '';
  const c = msg.content;
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object' && 'text' in c && typeof c.text === 'string') return c.text;
  return '';
}

function getAssistantText(msg: XModelMessage | undefined): string {
  if (!msg || msg.role !== 'assistant') return '';
  return getUserContent(msg);
}

function parsePayload(data: string | undefined): DifyStreamPayload | null {
  if (!data?.trim()) return null;
  try {
    return JSON.parse(data) as DifyStreamPayload;
  } catch {
    return null;
  }
}

/**
 * SSE 块为 `{ data: "json..." }`；阻塞 JSON 响应则为已解析对象且含 `answer` / `event`，无 `data` 字段。
 */
function payloadFromChunk(chunk: unknown): DifyStreamPayload | null {
  if (chunk == null || typeof chunk !== 'object') return null;
  const rec = chunk as Record<string, unknown>;
  if (typeof rec.data === 'string') {
    return parsePayload(rec.data);
  }
  if (
    typeof rec.answer === 'string' ||
    typeof rec.event === 'string' ||
    typeof rec.message === 'string' ||
    typeof rec.conversation_id === 'string'
  ) {
    return rec as DifyStreamPayload;
  }
  return null;
}

/**
 * 对接 Dify Chat App：`POST /v1/chat-messages`，`response_mode: streaming`（SSE）。
 *
 * 流式下 `answer` 多为增量片段，需与上一轮 assistant 内容拼接；阻塞 JSON 则通常为完整 `answer`。
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default class DifyChatProvider extends AbstractChatProvider<
  XModelMessage,
  XModelParams,
  DifySSEChunk
> {
  private conversationId = '';

  transformParams(
    requestParams: Partial<XModelParams>,
    options: XRequestOptions<XModelParams, DifySSEChunk, XModelMessage>,
  ): XModelParams {
    const optParams = options?.params as
      | { user?: string; inputs?: Record<string, unknown>; difyConversationId?: string }
      | undefined;
    const bootstrapId = optParams?.difyConversationId?.trim();
    if (bootstrapId && UUID_RE.test(bootstrapId)) {
      this.conversationId = bootstrapId;
    }

    const messages = requestParams.messages ?? this.getMessages();
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const query = getUserContent(lastUser);

    const user =
      (options?.params as { user?: string } | undefined)?.user ?? 'dify-web-user';
    const inputs =
      (options?.params as { inputs?: Record<string, unknown> } | undefined)?.inputs ?? {};

    return {
      inputs,
      query,
      response_mode: 'streaming',
      conversation_id: this.conversationId,
      user: String(user),
    } as XModelParams;
  }

  transformLocalMessage(requestParams: Partial<XModelParams>): XModelMessage | XModelMessage[] {
    return requestParams?.messages ?? [];
  }

  transformMessage(info: TransformMessage<XModelMessage, DifySSEChunk>): XModelMessage {
    const { originMessage, chunk, chunks, status } = info;

    const syncConversationId = (payload: DifyStreamPayload | null) => {
      if (payload?.conversation_id) {
        this.conversationId = payload.conversation_id;
      }
    };

    const applyAnswerDelta = (
      payload: DifyStreamPayload | null,
      origin: XModelMessage | undefined,
    ): XModelMessage | null => {
      if (!payload) return null;
      syncConversationId(payload);

      if (payload.event === 'error') {
        return { role: 'assistant', content: payload.message ?? 'Dify 请求错误' };
      }

      if (payload.event === 'message_replace' && payload.answer !== undefined) {
        return { role: 'assistant', content: payload.answer };
      }

      const ev = payload.event;
      const isTextChunk =
        ev === 'message' || ev === 'agent_message' || (ev === undefined && payload.answer !== undefined);

      if (!isTextChunk || payload.answer === undefined) {
        return null;
      }

      const prev = getAssistantText(origin);
      return { role: 'assistant', content: prev + payload.answer };
    };

    if (status === 'success' && chunks?.length) {
      let accumulated = '';
      for (const c of chunks) {
        const payload = payloadFromChunk(c);
        if (!payload) continue;
        if (payload.event === 'error') {
          return { role: 'assistant', content: payload.message ?? 'Dify 请求错误' };
        }
        syncConversationId(payload);
        if (payload.event === 'message_replace' && payload.answer !== undefined) {
          accumulated = payload.answer;
          continue;
        }
        if (payload.event === 'message' || payload.event === 'agent_message') {
          if (payload.answer !== undefined) {
            accumulated += payload.answer;
          }
          continue;
        }
        if (payload.answer !== undefined && payload.event === undefined) {
          accumulated += payload.answer;
        }
      }
      return { role: 'assistant', content: accumulated };
    }

    if (chunk !== undefined && chunk !== null) {
      const payload = payloadFromChunk(chunk);
      const out = applyAnswerDelta(payload, originMessage);
      if (out) return out;
    }

    const fallback =
      typeof originMessage?.content === 'string'
        ? originMessage.content
        : (originMessage?.content as { text?: string } | undefined)?.text ?? '';
    return { role: 'assistant', content: fallback };
  }
}
