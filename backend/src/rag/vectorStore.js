// pgvector 연결 및 문서 저장
import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

const poolConfig = {
    connectionString: process.env.DATABASE_URL,
};

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
});

export async function getVectorStore() {
    return await PGVectorStore.initialize(embeddings, {
        postgresConnectionOptions: poolConfig,
        tableName: "documents",
        columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content",
            metadataColumnName: "metadata",
        },
    });
}