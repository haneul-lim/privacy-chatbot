// PDF 파싱 및 벡터 저장
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "./vectorStore.js";

// 의미없는 청크 필터링
function isValidChunk(text) {
    const trimmed = text.trim();

    if (trimmed.length < 30) return false;          // 너무 짧은 청크

    // 공백 제거 후 순수 텍스트 길이로 판단
    const pureText = trimmed.replace(/\s/g, "");
    if (pureText.length < 20) return false;

    // 한글이 전혀 없는 청크 제외 (표지 영문만 있는 경우)
    const koreanCharCount = (trimmed.match(/[가-힣]/g) || []).length;
    if (koreanCharCount < 5) return false;

    return true;
}

export async function ingestPDF(filePath) {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, // 800 -> 600 (작게 나누어 정밀도 향상) -> 1000
        chunkOverlap: 150, // 100 -> 50 (중복 줄이기) -> 150 (문맥유지위해 증가)
        separators: ["\n\n", "\n", "。", ". ", " ", ""], // 문단/문장 우선 분리
    });
    
    const chunks = await splitter.splitDocuments(docs);
    const normalizedChunks = chunks.map((chunk) => ({
        ...chunk,
        pageContent: chunk.pageContent
            .replace(/\s+/g, " ")  // 연속 공백/줄바꿈을 단일 공백으로
            .trim(),
    }));

    // 필터링
    const validChunks = normalizedChunks.filter((c) => isValidChunk(c.pageContent));

    console.log(`전체 청크: ${chunks.length}개 -> 필터링 후 : ${isValidChunk.length}개`);

    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(validChunks);

    return validChunks.length;
}