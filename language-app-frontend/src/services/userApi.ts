import api from "./apiClient";
import type { User, Language } from "../types/index";
import type { UpdateUserRequest } from "../types/index";

export const updateUserAPI = async (
  data: UpdateUserRequest
): Promise<{ user: User; message: string }> => {
  const response = await api.put<{ user: User; message: string }>(
    "/user",
    data
  );
  return response.data;
};

export const updateInterfaceLanguage = async (
  interfaceLanguageId: string
): Promise<Language> => {
  const response = await api.put("/user/interface-language", {
    interfaceLanguageId,
  });
  return response.data;
};

export const uploadAvatarAPI = async (
  file: File
): Promise<{ avatar: string; message: string }> => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post<{ avatar: string; message: string }>(
    "/user/avatar",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteAvatarAPI = async (): Promise<{ message: string }> => {
  const response = await api.delete("/user/avatar");
  return response.data;
};
