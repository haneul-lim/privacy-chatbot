import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const loader = new PDFLoader("../../example_rag_data.pdf");
const docs = await loader.load();

console.log(`총 페이지: ${docs.length}`);
docs.slice(0, 3).forEach((d, i) => {
  console.log(`\n[페이지 ${i + 1}]`);
  console.log(d.pageContent.substring(0, 300));
});