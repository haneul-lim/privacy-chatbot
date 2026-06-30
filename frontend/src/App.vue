<template>
  <div class="container">
    <h1>🤖 클루 파인더 (ClueFinder) 🤖</h1>
    <h4>사용자의 질문에 대한 단서를 업로드한 PDF문서를 추척하여 매칭해줍니다.</h4>

    <!-- 문서 관리 섹션 -->
    <div class="doc-section">
      <div class="upload-row">
        <label class="file-label">
          <input type="file" accept=".pdf" @change="handleFile" />
          {{ file ? file.name : "PDF 파일 선택" }}
        </label>
        <button class="btn-primary" @click="uploadPDF" :disabled="!file || uploading">
          {{ uploading ? "처리 중..." : "문서 등록" }}
        </button>
        <button class="btn-danger" @click="confirmClear" :disabled="clearing">
          {{ clearing ? "초기화 중..." : "등록 문서 초기화" }}
        </button>
      </div>

      <!-- 상태 메시지 -->
      <div v-if="statusMsg" :class="['status-msg', statusType]">
        {{ statusMsg }}
      </div>
    </div>

    <!-- 채팅창 -->
    <div class="chat-box" ref="chatBox">
      <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.role]">
        <div class="bubble">
          <span v-if="msg.category" :class="['badge', msg.category]">
            {{ msg.category === "rag" ? "📄 문서 기반" : "💬 일반 답변" }}
          </span>
          <p>{{ msg.content }}</p>
        </div>
      </div>
    </div>

    <!-- 입력 -->
    <div class="input-row">
      <input
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="질문을 입력하세요..."
        :disabled="loading"
      />
      <button class="btn-primary" @click="sendMessage" :disabled="loading || !input.trim()">
        {{ loading ? "..." : "전송" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import axios from "axios";

const API = "http://localhost:3000/api";

const messages = ref([
  { role: "assistant", content: "안녕하세요! PDF를 등록하고 질문해 주세요." },
]);
const input = ref("");
const loading = ref(false);
const file = ref(null);
const uploading = ref(false);
const clearing = ref(false);
const statusMsg = ref("");
const statusType = ref(""); // "success" | "error" | "info"
const chatBox = ref(null);

function handleFile(e) {
  file.value = e.target.files[0];
  statusMsg.value = "";
}

function setStatus(msg, type = "info") {
  statusMsg.value = msg;
  statusType.value = type;
}

async function uploadPDF() {
  uploading.value = true;
  setStatus("⏳ 문서 처리 중... 스캔본의 경우 수 분이 소요될 수 있습니다.", "info");
  try {
    const form = new FormData();
    form.append("pdf", file.value);
    const { data } = await axios.post(`${API}/upload`, form);
    setStatus(`✅ ${data.chunks}개 청크 등록 완료 (누적)`, "success");
    file.value = null;
  } catch (e) {
    setStatus(`❌ 등록 실패: ${e.response?.data?.error || e.message}`, "error");
  } finally {
    uploading.value = false;
  }
}

async function confirmClear() {
  if (!confirm("등록된 모든 문서를 초기화하시겠습니까?")) return;
  clearing.value = true;
  setStatus("🗑️ 초기화 중...", "info");
  try {
    await axios.delete(`${API}/documents`);
    setStatus("✅ 문서가 초기화되었습니다.", "success");
  } catch (e) {
    setStatus(`❌ 초기화 실패: ${e.response?.data?.error || e.message}`, "error");
  } finally {
    clearing.value = false;
  }
}

async function sendMessage() {
  if (!input.value.trim()) return;
  messages.value.push({ role: "user", content: input.value });
  const question = input.value;
  input.value = "";
  loading.value = true;

  try {
    const { data } = await axios.post(`${API}/chat`, { question });
    messages.value.push({
      role: "assistant",
      content: data.answer,
      category: data.category,
    });
  } catch (e) {
    messages.value.push({
      role: "assistant",
      content: "오류가 발생했습니다. 다시 시도해 주세요.",
    });
  } finally {
    loading.value = false;
    await nextTick();
    chatBox.value.scrollTop = chatBox.value.scrollHeight;
  }
}
</script>

<style scoped>
.container { max-width: 720px; margin: 40px auto; padding: 0 16px; font-family: sans-serif; }
h1 { font-size: 20px; margin-bottom: 16px; }

.doc-section { background: #f8f9fa; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
.upload-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.file-label {
  flex: 1;
  min-width: 160px;
  padding: 8px 12px;
  border: 1px dashed #aaa;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-label input { display: none; }

.status-msg { margin-top: 10px; font-size: 13px; padding: 6px 10px; border-radius: 4px; }
.status-msg.success { background: #e6f4ea; color: #2d7a3a; }
.status-msg.error   { background: #fdecea; color: #c0392b; }
.status-msg.info    { background: #e8f0fe; color: #1a56a0; }

.chat-box { border: 1px solid #ddd; border-radius: 8px; height: 420px; overflow-y: auto; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 12px; }

.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }

.bubble { max-width: 80%; }
.bubble p { margin: 4px 0 0; padding: 10px 14px; border-radius: 12px; line-height: 1.5; font-size: 14px; white-space: pre-wrap; }
.message.user .bubble p { background: #0066ff; color: white; border-radius: 12px 12px 2px 12px; }
.message.assistant .bubble p { background: #f1f1f1; border-radius: 12px 12px 12px 2px; }

.badge { font-size: 11px; padding: 2px 7px; border-radius: 4px; display: inline-block; }
.badge.rag     { background: #e6f4ea; color: #2d7a3a; }
.badge.general { background: #f0f0f0; color: #666; }

.input-row { display: flex; gap: 8px; }
.input-row input { flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; }
.input-row input:focus { border-color: #0066ff; }

.btn-primary { padding: 9px 16px; background: #0066ff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; white-space: nowrap; }
.btn-primary:disabled { background: #aaa; cursor: not-allowed; }
.btn-danger  { padding: 9px 16px; background: #fff; color: #e03131; border: 1px solid #e03131; border-radius: 6px; cursor: pointer; font-size: 14px; white-space: nowrap; }
.btn-danger:disabled  { opacity: 0.5; cursor: not-allowed; }
</style>