import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import {
  CardFiltersDTO,
  CreateCardDTO,
  ReviewCardsFiltersDTO,
  SubmitCardDTO,
  UpdateCardDTO,
} from "./card.dto";
import { CardService } from "./CardService";

export const getCards = async (
  req: Request<{}, {}, {}, CardFiltersDTO>,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!req.userRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { cards, total } = await CardService.getCards(
      req.userId,
      req.userRole,
      req.query
    );
    res.json({ cards, total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch cards: ${message}` });
  }
};

export const getReviewCards = async (
  req: Request<{}, {}, {}, ReviewCardsFiltersDTO>,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { cards, attemptId } = await CardService.getReviewCards(
      req.userId,
      req.query
    );
    res.json({ cards, attemptId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch review cards: ${message}` });
  }
};

export const getTestCards = async (
  req: Request<{}, {}, {}, ReviewCardsFiltersDTO>,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { cards, attemptId } = await CardService.getTestCards(
      req.userId,
      req.query
    );
    res.json({ cards, attemptId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch test cards: ${message}` });
  }
};

export const createCard = async (
  req: Request<{}, {}, CreateCardDTO>,
  res: Response
) => {
  try {
    const card = await CardService.createCard(req.body);
    res.status(201).json(card);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to create card: ${message}` });
  }
};

export const submitCard = async (
  req: Request<{ id: string }, {}, SubmitCardDTO>,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await CardService.submitCard(
      req.userId,
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to submit card: ${message}` });
  }
};

export const updateCard = async (
  req: Request<{ id: string }, {}, UpdateCardDTO>,
  res: Response
) => {
  try {
    const card = await CardService.updateCard(req.params.id, req.body);
    res.json(card);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to update card: ${message}` });
  }
};

export const deleteCard = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await CardService.deleteCard(req.params.id);
    res.json({ message: "Card deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to delete card: ${message}` });
  }
};
