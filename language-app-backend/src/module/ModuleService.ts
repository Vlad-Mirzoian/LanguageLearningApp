import {
  ModuleFullDTO,
  ModuleFiltersDTO,
  CreateModuleDTO,
  UpdateModuleOrdersDTO,
  UpdateModuleDTO,
} from "./module.dto";
import { IModule, IModulePopulated } from "./module.interface";
import Language from "../language/Language";
import Module from "../module/Module";
import Card from "../card/Card";
import Level from "../level/Level";

export class ModuleService {
  static async getModules(
    data: ModuleFiltersDTO
  ): Promise<{ modules: ModuleFullDTO[]; total: number }> {
    const { languageId, name, limit = 20, skip = 0 } = data;
    if (languageId) {
      const language = await Language.findById(languageId).lean();
      if (!language) {
        throw new Error("Language not found");
      }
    }
    const query = {
      ...(languageId && { languageId }),
      ...(name && { name: { $regex: name, $options: "i" } }),
    };
    const [modulesRaw, total] = await Promise.all([
      Module.find(query)
        .populate({ path: "languageId", select: "name code" })
        .sort({ order: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IModulePopulated[]>(),
      Module.countDocuments(query),
    ]);
    const modules: ModuleFullDTO[] = modulesRaw.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      description: m.description,
      language: {
        id: m.languageId._id.toString(),
        name: m.languageId.name,
        code: m.languageId.code,
      },
      order: m.order,
      requiredScore: m.requiredScore,
    }));
    return { modules, total };
  }

  static async createModule(data: CreateModuleDTO): Promise<ModuleFullDTO> {
    const { name, description, order, requiredScore, languageId } = data;
    const [existingOrder, language] = await Promise.all([
      Module.findOne({ order }).lean(),
      Language.findById(languageId).lean(),
    ]);
    if (existingOrder) {
      throw new Error("Order value is already taken");
    }
    if (!language) {
      throw new Error("Language not found");
    }
    const saved = await new Module({
      name,
      description,
      order,
      requiredScore,
      languageId,
      wordsCount: 0,
    }).save();
    const populated = await Module.findById(saved._id)
      .populate({ path: "languageId", select: "name code" })
      .lean<IModulePopulated>();
    if (!populated) {
      throw new Error("Failed to populate module after save");
    }
    const moduleDTO: ModuleFullDTO = {
      id: populated._id.toString(),
      name: populated.name,
      description: populated.description,
      language: {
        id: populated.languageId._id.toString(),
        name: populated.languageId.name,
        code: populated.languageId.code,
      },
      order: populated.order,
      requiredScore: populated.requiredScore,
    };
    return moduleDTO;
  }

  static async updateModuleOrders(
    orders: UpdateModuleOrdersDTO[]
  ): Promise<void> {
    const orderValues = orders.map((o) => o.order);
    if (new Set(orderValues).size !== orders.length) {
      throw new Error("Order values must be unique");
    }
    const modules = (await Module.find({
      _id: { $in: orders.map((o) => o.id) },
    }).lean()) as IModule[];
    if (modules.length !== orders.length) {
      throw new Error("One or more module IDs not found");
    }
    const languageIds = new Set(modules.map((m) => m.languageId.toString()));
    if (languageIds.size > 1) {
      throw new Error("All modules must belong to the same language");
    }
    const tempOps = orders.map(({ id }, idx) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: idx + 1000 } },
      },
    }));
    await Module.bulkWrite(tempOps);
    const finalOps = orders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order } },
      },
    }));
    await Module.bulkWrite(finalOps);
  }

  static async updateModule(
    moduleId: string,
    data: UpdateModuleDTO
  ): Promise<ModuleFullDTO> {
    const { name, description, order, requiredScore, languageId } = data;
    if (languageId) {
      const language = await Module.findById(languageId).lean();
      if (!language) {
        throw new Error("Language not found");
      }
    }
    if (order && languageId) {
      const existingOrder = await Module.findOne({
        order,
        languageId,
        _id: { $ne: moduleId },
      }).lean();
      if (existingOrder) {
        throw new Error("Order value is already taken for this language");
      }
    }

    const updateData: Partial<UpdateModuleDTO> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (order) updateData.order = order;
    if (requiredScore !== undefined) updateData.requiredScore = requiredScore;
    if (languageId) updateData.languageId = languageId;

    const module = await Module.findOneAndUpdate(
      { _id: moduleId },
      updateData,
      { new: true, runValidators: true, lean: true }
    )
      .populate({ path: "languageId", select: "name code" })
      .lean<IModulePopulated>();
    if (!module) {
      throw new Error("Module not found");
    }
    const moduleDTO: ModuleFullDTO = {
      id: module._id.toString(),
      name: module.name,
      description: module.description,
      language: {
        id: module.languageId._id.toString(),
        name: module.languageId.name,
        code: module.languageId.code,
      },
      order: module.order,
      requiredScore: module.requiredScore,
    };
    return moduleDTO;
  }

  static async deleteModule(moduleId: string): Promise<void> {
    const module = await Module.findOneAndDelete({
      _id: moduleId,
    }).lean();
    if (!module) {
      throw new Error("Module not found");
    }
    await Promise.all([
      Card.deleteMany({ moduleId: moduleId }),
      Level.deleteMany({ moduleId: moduleId }),
    ]);
  }
}
