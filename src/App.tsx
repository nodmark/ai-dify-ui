import { MenuFoldOutlined, MenuUnfoldOutlined, OpenAIOutlined } from '@ant-design/icons';
import {
  Bubble,
  Sender,
  XProvider,
  type ActionsFeedbackProps,
  type BubbleListProps,
  type SenderProps,
} from '@ant-design/x';
import {
  type DefaultMessageInfo,
  type SSEFields,
  type XModelMessage,
  type XModelParams,
  useXChat,
  XRequest,
} from '@ant-design/x-sdk';
import {
  DifyChatProvider,
  getDifyApiKey,
  getDifyChatMessagesUrl,
  getDifyUserId,
  isDifyConversationId,
  listDifyConversationMessages,
  mapDifyHistoryRowsToDefaultMessages,
} from './services/dify';
import { Button, Flex, Spin, Tooltip, type GetRef } from 'antd';
import { clsx } from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import '@ant-design/x-markdown/themes/light.css';
import '@ant-design/x-markdown/themes/dark.css';
import type { BubbleListRef } from '@ant-design/x/es/bubble';
import { useMarkdownTheme } from './x-markdown/demo/utils';
import locale from './utils/local';
import BaseConversations from './components/Conversations';
import { DEFAULT_CONVERSATIONS_ITEMS } from './constant';
import BaseContent from './components/BaseContent';
import { useStyle } from './hooks';
import BaseWelcome from './components/Welcome';
import Footer from './components/Footer';

function getAssistantPlainText(msg: XModelMessage | undefined): string {
  if (!msg || msg.role !== 'assistant') return '';
  const c = msg.content;
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object' && 'text' in c && typeof (c as { text: string }).text === 'string') {
    return (c as { text: string }).text;
  }
  return '';
}

// ==================== Context ====================

interface ChatMessage extends XModelMessage {
  extraInfo?: {
    feedback: ActionsFeedbackProps['value'];
  };
}

const ChatContext = React.createContext<{
  onReload?: ReturnType<typeof useXChat>['onReload'];
  setMessage?: ReturnType<typeof useXChat<ChatMessage>>['setMessage'];
}>({});

const HISTORY_MESSAGES: {
  [key: string]: DefaultMessageInfo<XModelMessage>[];
} = {
  'default-1': [
    {
      message: { role: 'user', content: locale.howToQuicklyInstallAndImportComponents },
      status: 'success',
    },
    {
      message: {
        role: 'assistant',
        content: locale.aiMessage_2,
      },
      status: 'success',
    },
  ],
  'default-2': [
    { message: { role: 'user', content: locale.newAgiHybridInterface }, status: 'success' },
    {
      message: {
        role: 'assistant',
        content: locale.aiMessage_1,
      },
      status: 'success',
    },
  ],
};

const slotConfig: SenderProps['slotConfig'] = [
  { type: 'text', value: locale.slotTextStart },
  {
    type: 'select',
    key: 'destination',
    props: {
      defaultValue: 'X SDK',
      options: ['X SDK', 'X Markdown', 'Bubble'],
    },
  },
  { type: 'text', value: locale.slotTextEnd },
];
const historyMessageFactory = (conversationKey: string): DefaultMessageInfo<XModelMessage>[] => {
  return HISTORY_MESSAGES[conversationKey] || [];
};

/** 异步 defaultMessages：Dify 会话拉取 GET /v1/messages，否则走本地演示数据 */
async function loadDefaultMessagesForConversation(info?: {
  conversationKey?: string;
}): Promise<DefaultMessageInfo<XModelMessage>[]> {
  const key = info?.conversationKey ?? '';
  if (!key) return [];

  const hasApi = !!getDifyApiKey();

  if (hasApi && isDifyConversationId(key)) {
    try {
      const res = await listDifyConversationMessages({
        conversation_id: key,
        limit: 100,
      });
      const chronological = [...res.data].reverse();
      return mapDifyHistoryRowsToDefaultMessages(chronological);
    } catch (e) {
      console.warn('[Dify] 加载历史消息失败', e);
      return [];
    }
  }

  if (hasApi && key.startsWith('new-')) {
    return [];
  }

  return historyMessageFactory(key);
}
const providerCaches = new Map<string, DifyChatProvider>();
const providerFactory = (conversationKey: string) => {
  if (!providerCaches.get(conversationKey)) {
    const apiKey = getDifyApiKey();
    if (!apiKey) {
      console.error(
        '[Dify] 请在 .env 中配置 VITE_DIFY_API_KEY（Dify 应用「API 访问」中的 App API Key）',
      );
    }
    const url = getDifyChatMessagesUrl();
    providerCaches.set(
      conversationKey,
      new DifyChatProvider({
        request: XRequest<XModelParams, Partial<Record<SSEFields, string>>>(url, {
          manual: true,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          params: {
            user: getDifyUserId(),
            inputs: {},
            difyConversationId: conversationKey,
          },
        }),
      }),
    );
  }
  return providerCaches.get(conversationKey);
};


const getRole = (): BubbleListProps['role'] => ({
  assistant: {
    placement: 'start',
    footer: (content, { status, key }) => (
      <Footer content={content} status={status} id={key as string} />
    ),
    /** Markdown 在右侧 BaseContent 渲染，此处仅展示纯文本摘要 */
    contentRender: (content: string) => (
      <div
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 280,
          overflow: 'auto',
        }}
      >
        {content}
      </div>
    ),
  },
  user: { placement: 'end' },
});

const App = () => {
  const [className] = useMarkdownTheme();
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  const [curConversation, setCurConversation] = useState<string>(
    DEFAULT_CONVERSATIONS_ITEMS[0].key,
  );
  const [activeConversation, setActiveConversation] = useState<string>();
  const listRef = useRef<BubbleListRef>(null);

  // ==================== Runtime ====================

  const { onRequest, messages, isRequesting, abort, onReload, setMessage, isDefaultMessagesRequesting } = useXChat({
    provider: providerFactory(curConversation), // every conversation has its own provider
    conversationKey: curConversation,
    defaultMessages: loadDefaultMessagesForConversation,
    requestPlaceholder: () => {
      return {
        content: locale.noData,
        role: 'assistant',
      };
    },
    requestFallback: (_, { error, errorInfo, messageInfo }) => {
      if (error.name === 'AbortError') {
        return {
          content: messageInfo?.message?.content || locale.requestAborted,
          role: 'assistant',
        };
      }
      return {
        content: errorInfo?.error?.message || locale.requestFailed,
        role: 'assistant',
      };
    },
  });

  const { styles } = useStyle();
  /** 右侧 Markdown 预览区，默认收缩 */
  const [previewPanelOpen, setPreviewPanelOpen] = useState(false);
  const [deepThink, setDeepThink] = useState<boolean>(true);

  let lastAssistantPreview = { text: '', streaming: false };
  for (let i = messages.length - 1; i >= 0; i--) {
    const item = messages[i];
    if (item.message.role === 'assistant') {
      lastAssistantPreview = {
        text: getAssistantPlainText(item.message),
        streaming: item.status === 'updating',
      };
      break;
    }
  }

  useEffect(() => {
    senderRef.current?.focus({
      cursor: 'end',
    });
  }, [curConversation]);
  return (
    <>
    <XProvider locale={locale}>
      <ChatContext.Provider value={{ onReload, setMessage }}>
        {/* {contextHolder as unknown as React.ReactNode} */}
        <div className={styles.layout}>
          <div className={styles.side}>
            <div className={styles.logo}>
              <img
                src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
                draggable={false}
                alt="logo"
                width={24}
                height={24}
              />
              {/* <span>AntD X</span> */}
            </div>
            <BaseConversations 
              messages={messages}
              setCurConversation={setCurConversation}
              curConversation={curConversation}
              activeConversation={activeConversation}
              setActiveConversation={setActiveConversation}
            />
          </div>
          <div className={styles.chat}>
            <div className={styles.chatList}>
              {messages?.length !== 0 && (
                /* 🌟 消息列表 */
                <Bubble.List
                  ref={listRef}
                  styles={{
                    root: {
                      maxWidth: 940,
                      height: 'calc(100% - 160px)',
                      marginBlockEnd: 24,
                    },
                  }}
                  items={messages?.map((i) => ({
                    ...i.message,
                    key: i.id,
                    status: i.status,
                    loading: i.status === 'loading',
                    extraInfo: i.message.extraInfo,
                  }))}
                  role={getRole()}
                />
              )}
              <div
                style={{ width: '100%', maxWidth: 840, justifyContent: 'space-between' }}
                className={clsx({ [styles.startPage]: messages.length === 0 })}
              >
                {messages.length === 0 && isDefaultMessagesRequesting && (
                  <Flex justify="center" align="center" style={{ minHeight: 120 }}>
                    <Spin />
                  </Flex>
                )}
                {messages.length === 0 && !isDefaultMessagesRequesting && <BaseWelcome />}
                <Sender
                  suffix={false}
                  ref={senderRef}
                  key={curConversation}
                  slotConfig={slotConfig}
                  loading={isRequesting}
                  onSubmit={(val) => {
                    if (!val) return;
                    onRequest({
                      messages: [{ role: 'user', content: val }],
                      thinking: {
                        type: 'disabled',
                      },
                    });
                    listRef.current?.scrollTo({ top: 'bottom' });
                    setActiveConversation(curConversation);
                    senderRef.current?.clear?.();
                  }}
                  onCancel={() => {
                    abort();
                  }}
                  placeholder={locale.placeholder}
                  footer={(actionNode) => {
                    return (
                      <Flex justify="space-between" align="center">
                        <Flex gap="small" align="center">
                          <Sender.Switch
                            value={deepThink}
                            onChange={(checked: boolean) => {
                              setDeepThink(checked);
                            }}
                            icon={<OpenAIOutlined />}
                          >
                            {locale.deepThink}
                          </Sender.Switch>
                        </Flex>
                        <Flex align="center">{actionNode}</Flex>
                      </Flex>
                    );
                  }}
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </div>
            </div>
          </div>
          <div
            className={clsx(
              styles.contentShell,
              previewPanelOpen ? styles.contentShellExpanded : styles.contentShellCollapsed,
            )}
          >
            <div className={styles.previewToggle}>
              <Tooltip
                title={
                  previewPanelOpen ? locale.collapsePreviewPanel : locale.expandPreviewPanel
                }
              >
                <Button
                  type="text"
                  size="large"
                  icon={previewPanelOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                  onClick={() => setPreviewPanelOpen((v) => !v)}
                  aria-label={
                    previewPanelOpen ? locale.collapsePreviewPanel : locale.expandPreviewPanel
                  }
                />
              </Tooltip>
            </div>
            {previewPanelOpen && (
              <div className={styles.previewPanel}>
                <BaseContent
                  markdown={lastAssistantPreview.text}
                  streaming={lastAssistantPreview.streaming}
                  markdownClassName={className}
                />
              </div>
            )}
          </div>
        </div>
      </ChatContext.Provider>
    </XProvider>
    </>
  );
};

export default App;