import { LanguageDTO } from "../language/language.dto";

export interface UpdateInterfaceLanguageRequest {
  interfaceLanguageId: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  password?: string;
  nativeLanguageId?: string | null;
  learningLanguagesIds?: string[];
}

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  interfaceLanguage: LanguageDTO;
  nativeLanguageId?: string | null;
  learningLanguagesIds?: string[];
  avatar?: string | null;
}

export interface UserMiniDTO {
  id: string;
  username: string;
  avatar: string;
}
