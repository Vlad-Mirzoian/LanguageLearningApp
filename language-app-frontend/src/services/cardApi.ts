import api from "./apiClient";
import type { CardResponse, Card, Attempt, ReviewCard } from "../types/index";
import type {
  CardFiltersDTO,
  CreateCardDTO,
  ReviewCardsFiltersDTO,
  SubmitCardDTO,
  UpdateCardDTO,
} from "../types/index";

export const getCards = async (
  filters: CardFiltersDTO = {}
): Promise<CardResponse> => {
  const response = await api.get("/cards", { params: filters });
  return response.data;
};

export const createCard = async (data: CreateCardDTO): Promise<Card> => {
  const response = await api.post("/cards", data);
  return response.data;
};

export const updateCard = async (
  cardId: string,
  data: UpdateCardDTO
): Promise<Card> => {
  const response = await api.put(`/cards/${cardId}`, data);
  return response.data;
};

export const deleteCard = async (
  cardId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/cards/${cardId}`);
  return response.data;
};

export const getReviewCards = async (
  filters: ReviewCardsFiltersDTO
): Promise<ReviewCard[]> => {
  const response = await api.get("/cards/review", { params: filters });
  return response.data;
};

export const submitCard = async (
  cardId: string,
  data: SubmitCardDTO
): Promise<{
  isCorrect: boolean;
  correctTranslation: string;
  quality: number;
  attempt: Attempt;
}> => {
  const response = await api.post(`/cards/${cardId}/submit`, data);
  return response.data;
};
