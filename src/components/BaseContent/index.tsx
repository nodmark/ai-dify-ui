import { createStyles } from 'antd-style';
import { useState } from 'react';
import XMarkdown from '@ant-design/x-markdown';
import ThinkComponent from '../Thinking';
import locale from '../../utils/local';

const useWorkareaStyle = createStyles(({ token, css }) => {
  return {
    workarea: css`
      flex: 1;
      background: ${token.colorBgLayout};
      display: flex;
      flex-direction: column;
    `,
    workareaBody: css`
      flex: 1;
      padding: ${token.padding}px;
      background: ${token.colorBgContainer};
      border-radius: ${token.borderRadius}px;
      min-height: 0;
    `,
    bodyContent: css`
      overflow: auto;
      height: 100%;
      padding-right: 10px;
    `,
    empty: css`
      color: ${token.colorTextSecondary};
      padding: 16px;
      font-size: 14px;
    `,
  };
});

export type BaseContentProps = {
  /** 右侧预览区渲染的 Markdown 正文（通常为当前最后一条助手回复） */
  markdown: string;
  /** 是否与流式生成同步（最后一条助手为 updating 时为 true） */
  streaming?: boolean;
  /** 与 useMarkdownTheme 一致，用于主题 class */
  markdownClassName?: string;
};

export default function BaseContent({
  markdown,
  streaming = false,
  markdownClassName = '',
}: BaseContentProps) {
  const { styles: workareaStyles } = useWorkareaStyle();
  const [copilotOpen] = useState(true);

  return (
    <div className={workareaStyles.workarea}>
      <div
        className={workareaStyles.workareaBody}
        style={{ margin: copilotOpen ? 16 : '16px 48px' }}
      >
        <div className={workareaStyles.bodyContent}>
          {markdown.trim() ? (
            <XMarkdown
              paragraphTag="div"
              components={{
                think: ThinkComponent,
              }}
              className={markdownClassName}
              content={markdown}
              streaming={{
                hasNextChunk: streaming,
                enableAnimation: true,
              }}
            />
          ) : (
            <div className={workareaStyles.empty}>{locale.noData}</div>
          )}
        </div>
      </div>
    </div>
  );
}
