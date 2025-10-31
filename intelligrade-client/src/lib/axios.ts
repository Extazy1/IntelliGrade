import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

import { API_HOST } from "./host";
import { toast } from "@/hooks/use-toast";
import { ErrorResponse } from "@/types/types";
import { safeGetStorageItem, safeRemoveStorageItem } from "./storage";

/**
 * Custom Axios instance for API requests
 */
export const axiosInstance = axios.create({
    baseURL: API_HOST,
});


/**
 * 请求拦截器
 */
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 如果请求路径包含 /auth，则不添加 Authorization 头
        if (config.url?.includes("/auth")) {
            return config;
        }
        let token = Cookies.get("jwt");

        if (!token && typeof window !== "undefined") {
            const storedToken = safeGetStorageItem("jwt") ?? undefined;

            if (storedToken) {
                Cookies.set("jwt", storedToken);
            }

            token = storedToken;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError<ErrorResponse>) => {
        toast({
            variant: "destructive",
            title: error.response?.data.error.name,
            description: error.response?.data.error.message || "Failed to send request",
            duration: 2000
        });
        return Promise.reject(error);
    }
);

/**
 * 响应拦截器
 */
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError<ErrorResponse>) => {

        /**
         * Unauthorized error
         * 清理cookie, 重新登录
         */
        if (error.response?.status === 401) {
            Cookies.remove("jwt");
            safeRemoveStorageItem("jwt");
            window.location.href = "/auth/login";
            toast({
                variant: "destructive",
                title: error.response?.data.error.name,
                description: "Session expired, please login again",
                duration: 2000
            });
        } else {
            // 其他错误
            toast({
                variant: "destructive",
                title: error.response?.data.error.name,
                description: error.response?.data.error.message || "Failed to send request",
                duration: 2000
            });
        }

        // Return a resolved promise with a standardized error response
        // instead of rejecting the promise
        return Promise.resolve({
            data: {
                success: false,
                error: error.response?.data.error || {
                    name: error.response?.data.error.name || "Error",
                    message: error.response?.data.error.message || "An unexpected error occurred"
                }
            },
            status: error.response?.status || 500,
            statusText: error.response?.statusText || "Error",
            headers: error.response?.headers || {},
            config: error.config || {}
        } as AxiosResponse);
    }
);