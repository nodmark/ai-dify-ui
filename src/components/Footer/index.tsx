import { SyncOutlined } from "@ant-design/icons";
import { Actions } from "@ant-design/x";
import React from "react";
import locale from "../../utils/local";
import type { useXChat } from "@ant-design/x-sdk";

const ChatContext = React.createContext<{
  onReload?: ReturnType<typeof useXChat>['onReload'];
}>({});

const Footer: React.FC<{
  id?: string;
  content: string;
  status?: string;
  // onReload?: ReturnType<typeof useXChat>['onReload'];
}> = ({ id, content, status }) => {
  const context = React.useContext(ChatContext);
  const Items = [ 
    {
      key: 'retry',
      label: locale.retry,
      icon: <SyncOutlined />,
      onItemClick: () => {
        if (id) {
          context?.onReload?.(id, {
            userAction: 'retry',
          });
        }
      },
    },
    {
      key: 'copy',
      actionRender: <Actions.Copy text={content} />,
    },
  ];
  return status !== 'updating' && status !== 'loading' ? (
    <div style={{ display: 'flex' }}>{id && <Actions items={Items} />}</div>
  ) : null;
};


export default Footer;