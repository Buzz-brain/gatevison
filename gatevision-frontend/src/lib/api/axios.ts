import axios from "axios";
import { setupRequestInterceptor, setupResponseInterceptor } from "./interceptors";

const BASE_URL: string = (import.meta.env as Record<string, string>).VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

setupRequestInterceptor(api);
setupResponseInterceptor(api);
