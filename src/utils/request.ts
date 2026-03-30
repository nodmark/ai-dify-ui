import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

/** localStorage 中存放鉴权 token 的 key，可按项目修改 */
const AUTH_TOKEN_KEY = 'token';

function readBaseURL(): string {
  const v = import.meta.env.VITE_API_BASE_URL;
  return typeof v === 'string' ? v : '';
}

/** 已配置拦截器的 axios 实例，可直接 `request.get/post/...` 或配合下方便捷方法使用 */
export const request: AxiosInstance = axios.create({
  baseURL: readBaseURL(),
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(error),
);

export async function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await request.get<T>(url, config);
  return res.data;
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await request.post<T>(url, data, config);
  return res.data;
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await request.put<T>(url, data, config);
  return res.data;
}

export async function patch<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await request.patch<T>(url, data, config);
  return res.data;
}

/** 对应 HTTP DELETE；命名为 del 避免与关键字 delete 混淆 */
export async function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await request.delete<T>(url, config);
  return res.data;
}

export default request;
