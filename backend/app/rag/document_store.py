import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

class RAGStore:
    def __init__(self, data_path: str = "app/rag/data/adobe_kb.txt"):
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vectorstore = None
        self.data_path = data_path
        self._initialize_store()

    def _initialize_store(self):
        if not os.path.exists(self.data_path):
            print(f"Warning: KB file not found at {self.data_path}")
            return
            
        loader = TextLoader(self.data_path, encoding='utf-8')
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        docs = text_splitter.split_documents(documents)
        
        self.vectorstore = FAISS.from_documents(docs, self.embeddings)
        print("FAISS vector store initialized successfully.")

    def retrieve(self, query: str, k: int = 3):
        if not self.vectorstore:
            return ""
        
        docs = self.vectorstore.similarity_search(query, k=k)
        return "\n\n".join([doc.page_content for doc in docs])

# Singleton instance
rag_store = RAGStore()
