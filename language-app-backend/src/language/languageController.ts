import { Request, Response } from "express";
import { CreateLanguageDTO, UpdateLanguageDTO } from "./language.dto";
import { LanguageService } from "./LanguageService";

export const getLanguages = async (req: Request, res: Response) => {
  try {
    const languages = await LanguageService.getLanguages();
    res.json(languages);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch languages: ${message}` });
  }
};

export const createLanguage = async (
  req: Request<{}, {}, CreateLanguageDTO>,
  res: Response
) => {
  try {
    const language = await LanguageService.createLanguage(req.body);
    res.status(201).json(language);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to create language: ${message}` });
  }
};

export const updateLanguage = async (
  req: Request<{ id: string }, {}, UpdateLanguageDTO>,
  res: Response
) => {
  try {
    const language = await LanguageService.updateLanguage(
      req.params.id,
      req.body
    );
    res.json(language);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to update language: ${message}` });
  }
};

export const deleteLanguage = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await LanguageService.deleteLanguage(req.params.id);
    res.json({ message: "Language deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to delete language: ${message}` });
  }
};
