export interface UpdateUserRequest {
  email?: string;
  username?: string;
  password?: string;
  nativeLanguageId?: string | null;
  learningLanguagesIds?: string[];
}

