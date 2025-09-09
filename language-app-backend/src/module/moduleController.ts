import { Request, Response } from "express";
import {
  CreateModuleDTO,
  ModuleFiltersDTO,
  UpdateModuleDTO,
  UpdateModuleOrdersDTO,
} from "./module.dto";
import { ModuleService } from "./ModuleService";

export const getModules = async (
  req: Request<{}, {}, {}, ModuleFiltersDTO>,
  res: Response
) => {
  try {
    const { modules, total } = await ModuleService.getModules(req.query);
    res.json({ modules, total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch modules: ${message}` });
  }
};

export const createModule = async (
  req: Request<{}, {}, CreateModuleDTO>,
  res: Response
) => {
  try {
    const module = await ModuleService.createModule(req.body);
    res.status(201).json(module);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to create module: ${message}` });
  }
};

export const updateModuleOrders = async (
  req: Request<{}, {}, UpdateModuleOrdersDTO[]>,
  res: Response
) => {
  try {
    await ModuleService.updateModuleOrders(req.body);
    res.json({ message: "Module orders updated successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res
      .status(500)
      .json({ error: `Failed to update module orders: ${message}` });
  }
};

export const updateModule = async (
  req: Request<{ id: string }, {}, UpdateModuleDTO>,
  res: Response
) => {
  try {
    const module = await ModuleService.updateModule(req.params.id, req.body);
    res.json(module);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to update module: ${message}` });
  }
};

export const deleteModule = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await ModuleService.deleteModule(req.params.id);
    res.json({
      message: "Module and associated levels deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to delete module: ${message}` });
  }
};
