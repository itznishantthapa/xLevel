// api/client.js
// Axios instance configured with base URL and auth token injection

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints } from "./endpoints";
import { handleSessionExpired } from "../service/logoutService";

const SESSION_EXPIRED_MESSAGE = "Session expired. Please log in again.";

const rejectSessionExpired = async () => {
  await handleSessionExpired();
  return Promise.reject({ message: SESSION_EXPIRED_MESSAGE });
};

// Central API client
export const API = axios.create({
  // baseURL: "https://level.com.np",
  baseURL: "http://192.168.1.149:8000", // Update with your backend URL
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Inject bearer token from storage before every request (except auth endpoints)
API.interceptors.request.use(async (config) => {
  const noAuthEndpoints = ["/api/user/google/auth/","/api/user/apple/auth/", "/api/user/login/", "/api/user/register/"];
  
  // Check if the current request URL matches any of the no-auth endpoints
  const shouldSkipAuth = noAuthEndpoints.some((endpoint) => {
    const requestPath = config.url?.replace(config.baseURL || '', '');
    return requestPath === endpoint || requestPath?.endsWith(endpoint);
  });
  
  if (!shouldSkipAuth) {
    const token = await AsyncStorage.getItem("@access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});











API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // If we somehow receive an error without a request context, surface a safe failure
    if (!originalRequest) {
      if (__DEV__) {
        console.error('API Error without request context:', error);
      }
      return Promise.reject({ message: "Something went wrong.", original: error });
    }

    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      if (__DEV__) {
        console.error('Request timeout:', originalRequest.url);
      }
      return Promise.reject({ 
        message: "Request is taking longer than expected.", 
        original: error 
      });
    }

    // Handle network errors
    if (error.message === 'Network Error' || !error.response) {
      if (__DEV__) {
        console.error('Network error:', error.message);
      }
      return Promise.reject({ 
        message: "Unable to connect. Please check your internet connection.", 
        original: error 
      });
    }

    // Skip refresh logic for auth endpoints
    const authEndpoints = ["/api/user/google/auth/", "/api/user/login/", "/api/user/register/"];
    const isAuthEndpoint = authEndpoints.some((endpoint) => {
      const requestPath = originalRequest?.url?.replace(API.defaults.baseURL || '', '');
      return requestPath === endpoint || requestPath?.endsWith(endpoint);
    });

    // Handle 401 and try refresh (but not for auth endpoints)
    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refresh = await AsyncStorage.getItem("@refresh_token");
          if (!refresh) {
            return rejectSessionExpired();
          }

          if (!endpoints.refreshToken) {
            return rejectSessionExpired();
          }

          const { data } = await axios.post(`${API.defaults.baseURL}${endpoints.refreshToken}`, { refresh });
          if (__DEV__) {
            console.log('Token refresh successful');
          }

          if (!data.access) {
            return rejectSessionExpired();
          }

          await AsyncStorage.setItem("@access_token", data.access);
          API.defaults.headers.Authorization = `Bearer ${data.access}`;
          originalRequest.headers.Authorization = `Bearer ${data.access}`;

          return API(originalRequest);
        } catch (refreshErr) {
          if (__DEV__) {
            console.error('Token refresh failed:', refreshErr);
          }

          return rejectSessionExpired();
        }
      }

      return rejectSessionExpired();
    }

    // Your error handling messages
    let message = "Something went wrong. Please try again.";
    const backendMessage = error?.response?.data?.message;
    const errorsObj = error?.response?.data?.errors;

    if (backendMessage) {
      message = backendMessage;
    } else if (errorsObj && typeof errorsObj === "object") {
      const keys = Object.keys(errorsObj);
      if (keys.length > 0) {
        const firstVal = errorsObj[keys[0]];
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          message = String(firstVal[0]);
        } else if (typeof firstVal === "string") {
          message = firstVal;
        }
      }
    } else if (error?.response?.status === 500) {
      message = "Please try again later.";
    } else if (error?.response?.status === 503) {
      message = "Service temporarily unavailable.";
    } else if (error?.response?.status >= 400 && error?.response?.status < 500) {
      message = "Request failed.";
    }

    // Log the full error in development for debugging
    if (__DEV__) {
      console.error('API Error:', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error?.response?.status,
        message: message,
        error: error
      });
    }

    return Promise.reject({ message, original: error });
  }
);
