import axios from "axios";
import { API_URL } from "@env";

const BASE = (API_URL || "").trim().replace(/\/+$/, "");

export const api1 = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api1.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api1.defaults.headers.common.Authorization;
  }
}

api1.interceptors.request.use((cfg) => {
    const url = `${cfg.baseURL ?? ""}${cfg.url ?? ""}`;
    console.log("REQ:", cfg.method?.toUpperCase(), url);
    return cfg;
  });  
api1.interceptors.response.use(
  (res) => res,
  (err) => {
    console.log("ERR:", err.message, err?.response?.status, err?.response?.data);
    return Promise.reject(err);
  }
);
