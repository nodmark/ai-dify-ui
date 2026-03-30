import { createStyles } from 'antd-style';
import { useState } from 'react';
import XMarkdown from '@ant-design/x-markdown';
import ThinkComponent from '../Thinking';
import locale from '../../utils/local';

const useWorkareaStyle = createStyles(({ token, css }) => {
  /** 与全局 index.css（:root 18px、h1 56px）隔离，贴近 Ant Design 正文 14px */
  const md = token.fontSize;
  const lh = token.lineHeight;
  return {
    workarea: css`
      flex: 1;
      min-height: 0;
      height: 100%;
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
    /** 包裹 XMarkdown，统一字号与标题阶梯，避免继承 :root 过大字体 */
    markdownPreview: css`
      font-size: ${md}px;
      line-height: ${lh};
      color: ${token.colorText};

      & .x-markdown-light,
      & .x-markdown-dark {
        font-size: ${md}px;
        line-height: ${lh};
        --font-size: ${md}px;
      }

      & .x-markdown-light h1,
      & .x-markdown-dark h1 {
        font-size: ${token.fontSizeHeading4}px !important;
        line-height: 1.4 !important;
        margin: 10px 0 6px !important;
        letter-spacing: normal !important;
      }
      & .x-markdown-light h2,
      & .x-markdown-dark h2 {
        font-size: ${token.fontSizeLG}px !important;
        line-height: 1.45 !important;
        margin: 10px 0 6px !important;
        letter-spacing: normal !important;
      }
      & .x-markdown-light h3,
      & .x-markdown-dark h3 {
        font-size: ${md}px !important;
        line-height: 1.5 !important;
        font-weight: 600;
        margin: 8px 0 4px !important;
      }
      & .x-markdown-light h4,
      & .x-markdown-dark h4 {
        font-size: ${md}px !important;
        line-height: 1.5 !important;
        font-weight: 600;
        margin: 8px 0 4px !important;
      }

      & .x-markdown-light p,
      & .x-markdown-light li,
      & .x-markdown-dark p,
      & .x-markdown-dark li {
        font-size: ${md}px;
        line-height: ${lh};
      }

      & .x-markdown-light li::marker,
      & .x-markdown-dark li::marker {
        font-size: ${md}px;
        line-height: ${lh};
      }

      & .x-markdown-light th,
      & .x-markdown-light td,
      & .x-markdown-dark th,
      & .x-markdown-dark td {
        font-size: ${md}px;
      }

      & .x-markdown-light blockquote,
      & .x-markdown-dark blockquote {
        font-size: ${md}px;
      }

      /* Think 折叠区：子树可能不挂在 .x-markdown-* 下，仍会继承 :root 18px；全局 h1 也会放大 */
      & .ant-think {
        font-size: ${md}px;
        line-height: ${lh};
      }
      & .ant-think-content {
        font-size: ${md}px;
        line-height: ${lh};
      }
      & .ant-think-content p,
      & .ant-think-content li,
      & .ant-think-content div {
        font-size: ${md}px;
        line-height: ${lh};
      }
      & .ant-think-content h1 {
        font-size: ${token.fontSizeHeading4}px !important;
        line-height: 1.4 !important;
        margin: 8px 0 4px !important;
        letter-spacing: normal !important;
      }
      & .ant-think-content h2 {
        font-size: ${token.fontSizeLG}px !important;
        line-height: 1.45 !important;
        margin: 8px 0 4px !important;
        letter-spacing: normal !important;
      }
      & .ant-think-content h3,
      & .ant-think-content h4 {
        font-size: ${md}px !important;
        line-height: 1.5 !important;
        font-weight: 600;
        margin: 6px 0 4px !important;
      }
    `,
    empty: css`
      color: ${token.colorTextSecondary};
      padding: 16px;
      font-size: ${token.fontSize}px;
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
            <div className={workareaStyles.markdownPreview}>
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
            </div>
          ) : (
            <div className={workareaStyles.empty}>{locale.noData}</div>
          )}
        </div>
      </div>
    </div>
  );
}
