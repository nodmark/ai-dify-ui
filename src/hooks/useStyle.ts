import { createStyles } from "antd-style";

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      height: 100vh;
      display: flex;
      background: ${token.colorBgContainer};
      overflow: hidden;
    `,
    side: css`
      background: ${token.colorBgLayout};
      width: 200px;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 12px;
      box-sizing: border-box;
    `,
    logo: css`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 24px;
      box-sizing: border-box;
      gap: 8px;
      margin: 24px 0;

      span {
        font-weight: bold;
        color: ${token.colorText};
        font-size: 16px;
      }
    `,
    conversations: css`
      overflow-y: auto;
      margin-top: 12px;
      padding: 0;
      flex: 1;
      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    sideFooter: css`
      border-top: 1px solid ${token.colorBorderSecondary};
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    chat: css`
      height: 100%;
      // width: calc(50% - 200px);
      flex:1;
      overflow: auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding-block: ${token.paddingLG}px;
      padding-inline: ${token.paddingLG}px;
      gap: 16px;
      .ant-bubble-content-updating {
        background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
        background-size: 100% 2px;
        background-repeat: no-repeat;
        background-position: bottom;
      }
    `,
    startPage: css`
      display: flex;
      width: 100%;
      max-width: 840px;
      flex-direction: column;
      align-items: center;
      height: 100%;
    `,
    agentName: css`
      margin-block-start: 25%;
      font-size: 32px;
      margin-block-end: 38px;
      font-weight: 600;
    `,
    chatList: css`
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      flex-direction: column;
      justify-content: space-between;

    `,
    /** 右侧 Markdown 预览外壳：与展开宽度联动 */
    contentShell: css`
      display: flex;
      flex-direction: row;
      flex-shrink: 0;
      height: 100%;
      border-left: 1px solid ${token.colorBorderSecondary};
      overflow: hidden;
      transition: width 0.28s ease;
    `,
    contentShellCollapsed: css`
      width: 44px;
    `,
    contentShellExpanded: css`
      width: min(440px, 42vw);
      min-width: 280px;
    `,
    previewToggle: css`
      width: 44px;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      padding-top: 12px;
      border-right: 1px solid ${token.colorBorderSecondary};
      background: ${token.colorBgLayout};
    `,
    previewPanel: css`
      flex: 1;
      min-width: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `,
    placeholder: css`
      padding-top: 32px;
      width: 100%;
      padding-inline: ${token.paddingLG}px;
      box-sizing: border-box;
    `,
    chatPrompt:  css`
      .ant-prompts-label {
        color: #000000e0 !important;
      }
      .ant-prompts-desc {
        color: #000000a6 !important;
        width: 100%;
      }
      .ant-prompts-icon {
        color: #000000a6 !important;
      }
    `,
  };
});

export default useStyle