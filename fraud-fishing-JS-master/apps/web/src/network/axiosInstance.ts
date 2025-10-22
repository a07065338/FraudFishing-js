import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let isRefreshing = false;
let pending: Array<[(v: string) => void, (e: any) => void]> = [];

function onRefreshed(newAccess: string) {
  pending.forEach(([resolve]) => resolve(newAccess));
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
    (config.headers as any).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // evita loops
    if (error?.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }
    // si ya hay refresh en curso, cola la solicitud
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addPendingRequest((newAccess) => {
          original.headers.Authorization = `Bearer ${newAccess}`;
          resolve(axiosInstance(original));
        }, reject);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token");

      // Tu backend regresa SOLO accessToken nuevo (status 200) :contentReference[oaicite:4]{index=4}
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
      // limpiar sesión si falla el refresh
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return Promise.reject(e);
    }
  }
);
