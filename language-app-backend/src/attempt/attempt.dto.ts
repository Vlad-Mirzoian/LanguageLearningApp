import { LanguageMiniDTO } from "../language/language.dto";
import { LevelMiniDTO } from "../level/level.dto";
import { ModuleSummaryDTO } from "../module/module.dto";
import { UserMiniDTO } from "../user/user.dto";

export interface AttemptDTO {
  id: string;
  user: UserMiniDTO;
  language: LanguageMiniDTO;
  module: ModuleSummaryDTO;
  level: LevelMiniDTO;
  type: "flash" | "test" | "dictation";
  date: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
}
