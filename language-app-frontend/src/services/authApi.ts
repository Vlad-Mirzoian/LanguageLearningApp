import api from "./apiClient";
import type { User, AuthResponse } from "../types/index";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "../types/index";

export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await api.post<User>("/auth/register", data);
  return response.data;
};

export const loginAPI = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
};

export const refreshAPI = async (): Promise<{ token: string }> => {
  const response = await api.post("/auth/refresh");
  return response.data;
};

export const logoutAPI = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const verifyEmail = async (token: string) => {
  const response = await api.get(`/auth/verify/${token}`);
  return response.data;
};

export const forgotPassword = async (data: ForgotPasswordRequest) => {
  const response = await api.post(`/auth/forgot-password`, data);
  return response.data;
};

export const resetPassword = async (
  token: string,
  data: ResetPasswordRequest
) => {
  const response = await api.post(`/auth/reset-password/${token}`, data);
  return response.data;
};
