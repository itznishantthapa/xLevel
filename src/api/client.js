// api/client.js
// Axios instance configured with base URL and auth token injection

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints } from "./endpoints";

// Central API client
export const API = axios.create({
  // baseURL: "https://level.com.np",
  baseURL: "http://192.168.1.143:8000", // Update with your backend URL
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
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      try {
        // Check if refresh token exists
        const refresh = await AsyncStorage.getItem("@refresh_token");
        if (!refresh) {
          return Promise.reject({ message: "Session expired. Please log in again." });
        }
        
        // Missing endpoint for refreshing token in endpoints.js
        if (!endpoints.refreshToken) {
          return Promise.reject({ message: "Authentication configuration error. Please contact support." });
        }
        
        // Use the correct endpoint for token refresh
        const { data } = await axios.post(`${API.defaults.baseURL}${endpoints.refreshToken}`, { refresh });
        // Only log in development environments
        if (__DEV__) {
          console.log('Token refresh successful');
        }
        
        if (!data.access) {
          return Promise.reject({ message: "Authentication failed." });
        }
        
        // Store new access token
        await AsyncStorage.setItem("@access_token", data.access);
        
        // Update default headers
        API.defaults.headers.Authorization = `Bearer ${data.access}`;
        
        // Update the original request
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        
        // Retry the original request
        return API(originalRequest);
      } catch (refreshErr) {
        // Log error but don't expose details to the user
        if (__DEV__) {
          console.error('Token refresh failed:', refreshErr);
        }
        
        // Silently clear tokens and perform logout
        try {
          await AsyncStorage.multiRemove(["@access_token", "@refresh_token"]);
        } catch (storageErr) {
          if (__DEV__) {
            console.error('Failed to clear auth tokens from storage:', storageErr);
          }
        }
        
        // Return user-friendly message without error details
        return Promise.reject({ message: "Session expired. Please log in again." });
      }
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
