# 🤖 클루 파인더 (ClueFinder) 🤖

> 사용자의 질문에 대한 단서를 업로드한 PDF 문서를 추적하여 매칭해줍니다.

업로드한 PDF 문서를 기반으로 질문에 답하는 RAG(Retrieval-Augmented Generation) 챗봇입니다. 문서와 관련된 질문은 PDF 내용을 근거로, 문서와 무관한 질문은 일반 LLM 지식으로 답변하도록 자동 분기됩니다.

---

## 📌 주요 기능

- **PDF 업로드 및 인덱싱**: 업로드한 PDF를 청크 단위로 분할하여 벡터 DB에 저장
- **RAG 기반 질의응답**: 업로드한 문서 내용을 근거로 한 정확한 답변 제공
- **자동 라우팅**: 벡터 검색 유사도 점수를 기반으로 문서 기반 질문(RAG)과 일반 질문을 자동 분기
- **문서 초기화**: 등록된 문서를 언제든 초기화하고 새로운 문서로 교체 가능
- **출처 구분 표시**: 답변이 문서 기반(RAG)인지 일반 답변(General)인지 UI에서 구분 표시

---

## 🛠 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Vue 3, Axios |
| Backend | Node.js, Express |
| LLM Orchestration | LangChain.js |
| LLM / Embedding | OpenAI (gpt-4o-mini, text-embedding-3-small) |
| Vector DB | PostgreSQL + pgvector |
| Infra | Docker, Docker Compose |

---

## 🧠 아키텍처

```
[Vue3 Frontend]
      │
      ▼  PDF 업로드 / 질문 요청
[Express Backend]
      │
      ├── PDF 인덱싱 파이프라인
      │     PDFLoader → TextSplitter(청크 분할) → OpenAI Embeddings → pgvector 저장
      │
      └── 질의응답 파이프라인
            벡터 유사도 검색(Top-K)
                  │
            거리 점수(distance) 기반 분기
                  │
        ┌─────────┴─────────┐
   임계값 이하              임계값 초과
   (문서 관련)              (문서 무관)
        │                       │
   RAG 체인                 일반 LLM 체인
   (검색 컨텍스트 + LLM)     (LLM 단독)
        │                       │
        └─────────┬─────────┘
                   ▼
              최종 답변 반환
```

질문이 들어오면 먼저 pgvector에서 코사인 거리 기반으로 가장 유사한 청크들을 검색합니다. 가장 가까운 청크의 거리 점수가 임계값 이하면 해당 청크들을 컨텍스트로 삼아 RAG 프롬프트로 답변을 생성하고, 임계값을 초과하면 문서와 무관한 질문으로 판단하여 일반 LLM 프롬프트로 답변합니다.

---

## 📂 프로젝트 구조

```
cluefinder/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express 서버, API 라우팅
│   │   ├── chains/
│   │   │   └── chain.js      # RAG / 일반 답변 체인 및 라우팅 로직
│   │   ├── rag/
│   │   │   ├── ingest.js     # PDF 로드 → 청크 분할 → 벡터 저장
│   │   │   └── vectorStore.js # pgvector 연결 설정
│   │   └── prompts/
│   │       └── prompt.js     # RAG / 일반 프롬프트 템플릿
│   ├── uploads/               # 업로드된 PDF 임시 저장 경로
│   ├── .env
│   └── package.json
├── frontend/
│   └── src/
│       └── App.vue            # 챗봇 UI (업로드, 채팅, 초기화)
├── docker-compose.yml          # pgvector 컨테이너 설정
└── README.md
```

---

## 🚀 시작하기

### 1. 사전 준비

- Node.js v20 이상
- Docker / Docker Compose
- OpenAI API Key

### 2. 저장소 클론

```bash
git clone https://github.com/haneul-lim/privacy-chatbot.git
cd privacy-chatbot
```

### 3. 벡터 DB 실행 (pgvector)

```bash
docker-compose up -d
```

컨테이너 접속 후 pgvector 익스텐션을 활성화합니다. (최초 1회)

```bash
docker exec -it cluefinder-pgvector-1 psql -U chatbot -d chatbot_db
```

```sql
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 4. 백엔드 설정 및 실행

```bash
cd backend
npm install
```

`.env` 파일 생성:

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://chatbot:chatbot1234@localhost:5432/chatbot_db
PORT=3000
```

```bash
npm run dev
```

### 5. 프론트엔드 설정 및 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 📸 데모
<img src="https://github.com/user-attachments/assets/8ce71b4a-e4ba-44a9-9f24-2e65e2ea0dcd" width="50%" align="center">
---

## 💬 사용 방법

1. PDF 파일을 선택하고 **문서 등록** 버튼을 클릭합니다. (인덱싱 완료까지 수 초~수 분 소요)
2. 등록된 문서 내용을 채팅창에 질문합니다.
3. 답변 위에 표시되는 배지로 출처를 확인할 수 있습니다.
   - 📄 **문서 기반**: 업로드한 PDF 내용을 근거로 한 답변
   - 💬 **일반 답변**: 문서와 무관하게 LLM이 자체적으로 생성한 답변
4. 새로운 문서로 교체하고 싶다면 **등록 문서 초기화** 버튼으로 기존 벡터 데이터를 삭제할 수 있습니다.

---

## ⚙️ 핵심 구현 포인트

### RAG 파이프라인 설계
PDF를 의미 단위가 보존되도록 청크 분할(`chunkSize`, `chunkOverlap` 튜닝)하고, OpenAI 임베딩으로 벡터화하여 pgvector에 저장합니다. 질의 시점에는 코사인 거리 기반 유사도 검색으로 관련 청크를 추출합니다.

### LLM 기반 동적 라우팅
별도의 분류 모델 없이, 벡터 검색 결과의 거리 점수를 라우팅 신호로 활용하여 RAG 응답과 일반 응답 체인을 동적으로 분기하도록 구성했습니다. 이를 통해 문서에 없는 질문에도 자연스러운 답변이 가능합니다.

### Prompt Engineering
RAG 프롬프트는 컨텍스트에 근거하지 않은 내용은 답변하지 않도록 제한하여 환각(hallucination)을 최소화하고, 컨텍스트와 질문의 표현이 다르더라도 의미적으로 관련이 있으면 답변하도록 유연성을 부여했습니다.

---

## 🔮 향후 개선 방향

- 스캔본(이미지 기반) PDF를 위한 OCR 파이프라인 추가
- 단순 임계값 컷 대신 Reranking 또는 Hybrid Search(BM25 + Vector) 도입
- LangGraph 기반 멀티 스텝 에이전트로 확장 (대화 히스토리 반영, 검색 실패 시 재검색 등)
- 다중 PDF 업로드 시 문서별 출처 표기 기능
