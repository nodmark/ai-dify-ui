import { Conversations } from '@ant-design/x';
import { useXConversations } from '@ant-design/x-sdk';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';
import { Input, message, Modal } from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import locale from '../../utils/local';
import { DEFAULT_CONVERSATIONS_ITEMS } from '../../constant';
import {
  getDifyApiKey,
  isDifyConversationId,
  listDifyConversations,
  renameDifyConversation,
} from '../../services/dify';

type BaseConversationsProps = {
  messages: unknown[];
  setCurConversation: (conversation: string) => void;
  curConversation: string;
  activeConversation?: string;
  setActiveConversation: (conversation: string) => void;
};

const useStyle = createStyles(({ css }) => {
  return {
    conversations: css`
      overflow-y: auto;
      margin-top: 12px;
      padding: 0;
      flex: 1;
      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
  };
});

function groupLabelFromUpdatedAt(updatedAt: number | undefined): string {
  if (updatedAt == null) return locale.today;
  const d = dayjs.unix(updatedAt);
  if (d.isSame(dayjs(), 'day')) return locale.today;
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return locale.yesterday;
  return d.format('MM-DD');
}

export default function BaseConversations(props: BaseConversationsProps) {
  const { messages, curConversation, activeConversation, setCurConversation } = props;
  const apiKey = getDifyApiKey();
  const { conversations, addConversation, setConversations, setConversation } = useXConversations({
    defaultConversations: apiKey ? [] : DEFAULT_CONVERSATIONS_ITEMS,
  });
  const { styles } = useStyle();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameKey, setRenameKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameSubmitting, setRenameSubmitting] = useState(false);

  useEffect(() => {
    if (!apiKey) return;

    let cancelled = false;
    listDifyConversations({ limit: 50 })
      .then((res) => {
        if (cancelled) return;
        const items = res.data.map((c) => ({
          key: c.id,
          label: c.name?.trim() || c.id.slice(0, 8),
          group: groupLabelFromUpdatedAt(c.updated_at),
        }));
        setConversations(items);
        if (items.length > 0) {
          const next = items.some((i) => i.key === curConversation)
            ? curConversation
            : items[0].key;
          setCurConversation(next);
        } else {
          const nid = `new-${Date.now()}`;
          addConversation({
            key: nid,
            label: locale.newConversation,
            group: locale.today,
          });
          setCurConversation(nid);
        }
      })
      .catch((e: unknown) => {
        message.error(e instanceof Error ? e.message : locale.requestFailed);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅依赖 apiKey，避免与 setConversations 引用联动重复拉取
  }, [apiKey]);

  const openRename = (conversationKey: string) => {
    const raw = conversations.find((c) => c.key === conversationKey)?.label ?? '';
    setRenameKey(conversationKey);
    setRenameValue(raw);
    setRenameOpen(true);
  };

  const handleRenameOk = async () => {
    const name = renameValue.trim();
    if (!name) {
      message.warning(locale.pleaseEnterConversationName);
      return;
    }
    if (!renameKey) return;
    setRenameSubmitting(true);
    try {
      const updated = await renameDifyConversation(renameKey, { name });
      setConversation(renameKey, {
        key: renameKey,
        label: updated.name?.trim() || name,
      });
      message.success(locale.renameSucceeded);
      setRenameOpen(false);
      setRenameKey(null);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : locale.requestFailed);
    } finally {
      setRenameSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        title={locale.renameConversation}
        open={renameOpen}
        onOk={handleRenameOk}
        confirmLoading={renameSubmitting}
        onCancel={() => {
          setRenameOpen(false);
          setRenameKey(null);
        }}
        destroyOnClose
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder={locale.pleaseEnterConversationName}
          maxLength={200}
          showCount
          onPressEnter={() => void handleRenameOk()}
        />
      </Modal>
      <Conversations
        creation={{
          onClick: () => {
            if (messages.length === 0) {
              message.error(locale.itIsNowANewConversation);
              return;
            }
            const now = `new-${Date.now()}`;
            addConversation({
              key: now,
              label: `${locale.newConversation} ${conversations.length + 1}`,
              group: locale.today,
            });
            setCurConversation(now);
          },
        }}
        items={conversations
          .map(({ key, label, ...other }) => ({
            key,
            label: key === activeConversation ? `[${locale.curConversation}]${label}` : label,
            ...other,
          }))
          .sort(({ key }) => (key === activeConversation ? -1 : 0))}
        className={styles.conversations}
        activeKey={curConversation}
        onActiveChange={async (val) => {
          setCurConversation(val);
        }}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        menu={(conversation) => {
          const key = String(conversation.key);
          const menuItems = [];
          if (apiKey && isDifyConversationId(key)) {
            menuItems.push({
              label: locale.rename,
              key: 'rename',
              icon: <FormOutlined />,
              onClick: () => openRename(key),
            });
          }
          menuItems.push({
            label: locale.delete,
            key: 'delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              const newList = conversations.filter((item) => item.key !== conversation.key);
              const newKey = newList?.[0]?.key;
              setConversations(newList);
              if (conversation.key === curConversation) {
                setCurConversation(newKey ?? '');
              }
            },
          });
          return { items: menuItems };
        }}
      />
    </>
  );
}
