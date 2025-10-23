import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let isRefreshing = false;
let pending: Array<[(v: string) => void, (e: any) => void]> = [];

function onRefreshed(newAccess: string) {
  for (const [resolve] of pending) {
    resolve(newAccess);
  }
  pending = [];
}


function addPendingRequest(cb: (token: string) => void, reject: (e: any) => void) {
  pending.push([cb, reject]);
}

export const axiosInstance = axios.create({
  baseURL: API_BASE,
});

axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // 🚫 Evita loops infinitos
    if (error?.response?.status !== 401 || original?._retry) {
      throw error instanceof Error
        ? error
        : new Error(error?.message ?? "Request failed");
    }

    // ⏳ Si ya hay refresh en curso, cola la solicitud
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addPendingRequest(
          (newAccess) => {
            original.headers.Authorization = `Bearer ${newAccess}`;
            resolve(axiosInstance(original));
          },
          (err) => reject(err instanceof Error ? err : new Error(String(err)))
        );
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
      const newAccess = data.accessToken as string;

      localStorage.setItem("accessToken", newAccess);
      isRefreshing = false;

      onRefreshed(newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return axiosInstance(original);
    } catch (e) {
      isRefreshing = false;
      pending = [];
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      throw e instanceof Error ? e : new Error(String(e));
    }
  }
);


