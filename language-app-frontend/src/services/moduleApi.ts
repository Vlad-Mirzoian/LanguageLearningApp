import api from "./apiClient";
import type { Module, ModuleResponse } from "../types/index";
import type {
  CreateModuleDTO,
  ModuleFiltersDTO,
  UpdateModuleDTO,
  UpdateModuleOrdersDTO,
} from "../types/index";

export const getModules = async (
  filters: ModuleFiltersDTO = {}
): Promise<ModuleResponse> => {
  const response = await api.get("/modules", { params: filters });
  return response.data;
};

export const createModule = async (data: CreateModuleDTO): Promise<Module> => {
  const response = await api.post("/modules", data);
  return response.data;
};

export const updateModule = async (
  moduleId: string,
  data: UpdateModuleDTO
): Promise<Module> => {
  const response = await api.put(`/modules/${moduleId}`, data);
  return response.data;
};

export const deleteModule = async (
  moduleId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/modules/${moduleId}`);
  return response.data;
};

export const updateModuleOrders = async (
  orders: UpdateModuleOrdersDTO[]
): Promise<{ message: string }> => {
  const response = await api.put("/modules/order", { orders });
  return response.data;
};
