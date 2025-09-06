import { UserDTO } from "../user/user.dto";

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  interfaceLanguageId: string;
  nativeLanguageId?: string;
  learningLanguagesIds?: string[];
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}
