import { Request, Response } from "express";
import {
  CheckWordUniqueDTO,
  CreateWordDTO,
  UpdateWordDTO,
  WordFiltersDTO,
} from "./word.dto";
import { WordService } from "./WordService";

export const getWords = async (
  req: Request<{}, {}, {}, WordFiltersDTO>,
  res: Response
) => {
  try {
    const { words, total } = await WordService.getWords(req.query);
    res.json({ words, total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch words: ${message}` });
  }
};

export const createWord = async (
  req: Request<{}, {}, CreateWordDTO>,
  res: Response
) => {
  try {
    const word = await WordService.createWord(req.body);
    res.status(201).json(word);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to create word: ${message}` });
  }
};

export const checkUnique = async (
  req: Request<{}, {}, {}, CheckWordUniqueDTO>,
  res: Response
) => {
  try {
    const isUnique = await WordService.checkUnique(req.query);
    res.json(isUnique);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res
      .status(500)
      .json({ error: `Failed to check word uniqueness: ${message}` });
  }
};

export const updateWord = async (
  req: Request<{ id: string }, {}, UpdateWordDTO>,
  res: Response
) => {
  try {
    const word = await WordService.updateWord(req.params.id, req.body);
    res.json(word);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to update word: ${message}` });
  }
};

export const deleteWord = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await WordService.deleteWord(req.params.id);
    res.json({ message: "Word and related cards deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to delete word: ${message}` });
  }
};
