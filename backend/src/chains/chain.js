import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough } from "@langchain/core/runnables";
import { ragPrompt, generalPrompt } from "../prompts/prompt.js";
import { getVectorStore } from "../rag/vectorStore.js";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0});
const parser = new StringOutputParser();

const DISTANCE_THRESHOLD = 0.6; // 이 점수 미만이면 관련 문서 있음으로 판단

const ragChain = ragPrompt.pipe(llm).pipe(parser);
const generalChain = generalPrompt.pipe(llm).pipe(parser);

export async function chat(question) {
  const vectorStore = await getVectorStore();

  // 1단계: 벡터 검색으로 관련 문서 먼저 확인
  const searchResults = await vectorStore.similaritySearchWithScore(question, 5);

  console.log("\n===== 유사도 점수 =====");
  searchResults.forEach(([doc, score], i) => {
    console.log(`[${i + 1}] score: ${score.toFixed(4)} | ${doc.pageContent.substring(0, 80)}...`);
  });

  // // 2단계: 유사도 점수 기반으로 분기
  const bestScore = searchResults[0]?.[1] ?? 1;

  if (bestScore <= DISTANCE_THRESHOLD) {
    // 문서 관련 질문 → RAG 답변
    console.log("→ RAG 답변으로 분기");
    const context = searchResults.map(([doc]) => doc.pageContent).join("\n\n");
    const answer = await ragChain.invoke({ question, context });
    return { answer, category: "rag" };
  } else {
    // 문서와 무관한 질문 → 일반 LLM 답변
    console.log("→ general 답변으로 분기");
    const answer = await generalChain.invoke({ question });
    return { answer, category: "general" };
  }
}