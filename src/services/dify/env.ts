/**
 * Dify 本地/远程 API 配置（Vite 环境变量，需以 VITE_ 开头）
 *
 * - VITE_DIFY_API_BASE_URL：API 根路径，不含 /v1。默认 `/dify-proxy`（走 vite 代理，见 vite.config.ts）
 * - VITE_DIFY_ORIGIN：仅用于 dev 代理目标，例如 `http://127.0.0.1` 或 `http://127.0.0.1:8080`
 * - VITE_DIFY_API_KEY：在 Dify 应用「开发 / API 访问」中创建的 App API Key（格式通常为 app-xxx）
 * - VITE_DIFY_USER_ID（可选）：固定终端用户 id；不配则自动生成并写入 localStorage，与列表/发消息共用
 *
 * 控制台页面如 http://localhost/app/<uuid>/develop 中的 uuid 是应用 ID，不是 API Key。
 */

export function getDifyApiBaseUrl(): string {
  const raw = import.meta.env.VITE_DIFY_API_BASE_URL;
  const base =
    raw !== undefined && String(raw).trim() !== ''
      ? String(raw).replace(/\/$/, '')
      : '/dify-proxy';
  return base;
}

export function getDifyChatMessagesUrl(): string {
  return `${getDifyApiBaseUrl()}/v1/chat-messages`;
}

export function getDifyApiKey(): string {
  return import.meta.env.VITE_DIFY_API_KEY ?? '';
}

const DIFY_USER_STORAGE_KEY = 'dify-end-user-id';

/**
 * 与「会话列表 / 发消息」共用的终端用户标识，需与 Dify `user` 参数一致。
 * 优先 `VITE_DIFY_USER_ID`；否则用 localStorage 持久化随机 UUID。
 */
export function getDifyUserId(): string {
  const fromEnv = import.meta.env.VITE_DIFY_USER_ID;
  if (fromEnv !== undefined && String(fromEnv).trim() !== '') {
    return String(fromEnv).trim();
  }
  if (typeof localStorage === 'undefined') {
    return 'dify-web-user';
  }
  let id = localStorage.getItem(DIFY_USER_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DIFY_USER_STORAGE_KEY, id);
  }
  return id;
}
