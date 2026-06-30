// 프롬프트 템플릿
import { ChatPromptTemplate } from "@langchain/core/prompts";

export const ragPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `당신은 문서 기반 질문에 답하는 챗봇입니다.
컨텍스트에 질문과 정확히 같은 단어가 없더라도, 의미상 관련된 내용이 있다면 그 내용을 근거로 답변하세요.
컨텍스트에 전혀 관련된 내용이 없을 때만 "해당 내용은 문서에서 찾을 수 없습니다"라고 답하세요.

[컨텍스트]
{context}`,
  ],
  ["human", "{question}"],
]);

export const generalPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "당신은 친절한 AI 어시스턴트입니다. 간결하게 답변하세요.",
  ],
  ["human", "{question}"],
]);