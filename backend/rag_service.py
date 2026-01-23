"""
RAG (Retrieval-Augmented Generation) Service
Handles document embeddings, vector storage, and semantic retrieval using ChromaDB
"""

import os
from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings
from chunking_util import get_chunker
import uuid


class RAGService:
    """Core RAG service for document embeddings and retrieval"""
    
    def __init__(self, persist_directory: str = None):
        """
        Initialize RAG service with ChromaDB
        
        Args:
            persist_directory: Directory to persist ChromaDB data
        """
        # Set up ChromaDB persistence directory
        if persist_directory is None:
            basedir = os.path.abspath(os.path.dirname(__file__))
            persist_directory = os.path.join(basedir, "chroma_db")
        
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Lazy initialize embedding model to save memory during boot
        self._embedding_model = None
        
        # Get or create collection for documents
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"description": "TrueCost document embeddings"}
        )
        
        # Get chunker instance
        self.chunker = get_chunker()
    
    @property
    def embedding_model(self):
        """Lazy load the embedding model only when needed"""
        if self._embedding_model is None:
            print("📦 Loading embedding model (lazy mode)...")
            from sentence_transformers import SentenceTransformer
            self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Embedding model loaded")
        return self._embedding_model

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text"""
        embedding = self.embedding_model.encode(text, show_progress_bar=False)
        return embedding.tolist()
    
    def add_document(self, user_id: str, doc_id: str, text: str, 
                    doc_name: str = None, doc_type: str = None) -> Dict:
        """
        Add a document to the RAG system
        
        Args:
            user_id: User ID who owns the document
            doc_id: Unique document ID
            text: Full document text
            doc_name: Document filename
            doc_type: Document type (legal, financial, etc.)
            
        Returns:
            Dictionary with stats about chunks created
        """
        if not text or not text.strip():
            return {"success": False, "message": "Empty document text"}
        
        # Chunk the document
        chunks = self.chunker.chunk_document(
            text=text,
            doc_id=doc_id,
            user_id=user_id,
            doc_name=doc_name,
            doc_type=doc_type
        )
        
        if not chunks:
            return {"success": False, "message": "No chunks generated"}
        
        # Generate embeddings and prepare for ChromaDB
        chunk_ids = []
        chunk_texts = []
        chunk_embeddings = []
        chunk_metadatas = []
        
        for chunk in chunks:
            # Generate unique ID for this chunk
            chunk_id = f"{doc_id}_chunk_{chunk['chunk_index']}"
            chunk_ids.append(chunk_id)
            chunk_texts.append(chunk['text'])
            
            # Generate embedding
            embedding = self.generate_embedding(chunk['text'])
            chunk_embeddings.append(embedding)
            
            # Prepare metadata (ChromaDB requires string values)
            chunk_metadatas.append({
                "user_id": str(user_id),
                "doc_id": str(doc_id),
                "doc_name": chunk.get('doc_name', 'unknown'),
                "doc_type": chunk.get('doc_type', 'other'),
                "chunk_index": str(chunk['chunk_index']),
                "total_chunks": str(chunk['total_chunks']),
                "tokens": str(chunk['tokens'])
            })
        
        # Add to ChromaDB
        self.collection.add(
            ids=chunk_ids,
            embeddings=chunk_embeddings,
            documents=chunk_texts,
            metadatas=chunk_metadatas
        )
        
        return {
            "success": True,
            "doc_id": doc_id,
            "chunks_created": len(chunks),
            "total_tokens": sum(chunk['tokens'] for chunk in chunks)
        }
    
    def search_documents(self, user_id: str, query: str, top_k: int = 5,
                        doc_type: str = None) -> List[Dict]:
        """
        Search for relevant document chunks using semantic similarity
        
        Args:
            user_id: User ID to filter results
            query: Search query
            top_k: Number of top results to return
            doc_type: Optional document type filter
            
        Returns:
            List of relevant chunks with metadata and similarity scores
        """
        if not query or not query.strip():
            return []
        
        # Generate query embedding
        query_embedding = self.generate_embedding(query)
        
        # Build where filter for user
        where_filter = {"user_id": str(user_id)}
        if doc_type:
            where_filter["doc_type"] = doc_type
        
        # Query ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter
        )
        
        # Format results
        chunks = []
        if results and results['ids'] and len(results['ids']) > 0:
            for i in range(len(results['ids'][0])):
                chunks.append({
                    "text": results['documents'][0][i],
                    "metadata": results['metadatas'][0][i],
                    "similarity": 1 - results['distances'][0][i],  # Convert distance to similarity
                    "doc_id": results['metadatas'][0][i].get('doc_id'),
                    "doc_name": results['metadatas'][0][i].get('doc_name'),
                    "chunk_index": results['metadatas'][0][i].get('chunk_index')
                })
        
        return chunks
    
    def get_document_context(self, user_id: str, query: str, max_tokens: int = 2000) -> str:
        """
        Get relevant document context for a query, optimized for LLM input
        
        Args:
            user_id: User ID
            query: Search query
            max_tokens: Maximum tokens to return
            
        Returns:
            Concatenated relevant chunks as context string
        """
        chunks = self.search_documents(user_id, query, top_k=10)
        
        if not chunks:
            return ""
        
        # Build context string with source attribution
        context_parts = []
        current_tokens = 0
        
        for chunk in chunks:
            chunk_text = chunk['text']
            chunk_tokens = self.chunker.count_tokens(chunk_text)
            
            if current_tokens + chunk_tokens > max_tokens:
                break
            
            # Format with source
            doc_name = chunk['metadata'].get('doc_name', 'Unknown')
            source_text = f"[Source: {doc_name}]\n{chunk_text}\n"
            context_parts.append(source_text)
            current_tokens += chunk_tokens
        
        return "\n---\n".join(context_parts)
    
    def delete_document(self, user_id: str, doc_id: str) -> Dict:
        """
        Delete all chunks for a document
        
        Args:
            user_id: User ID (for verification)
            doc_id: Document ID to delete
            
        Returns:
            Dictionary with deletion status
        """
        # Find all chunks for this document
        results = self.collection.get(
            where={"user_id": str(user_id), "doc_id": str(doc_id)}
        )
        
        if not results or not results['ids']:
            return {"success": False, "message": "Document not found"}
        
        # Delete all chunks
        self.collection.delete(ids=results['ids'])
        
        return {
            "success": True,
            "chunks_deleted": len(results['ids'])
        }
    
    def delete_all_user_documents(self, user_id: str) -> Dict:
        """
        Delete all documents for a user
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with deletion status
        """
        results = self.collection.get(
            where={"user_id": str(user_id)}
        )
        
        if not results or not results['ids']:
            return {"success": True, "chunks_deleted": 0}
        
        self.collection.delete(ids=results['ids'])
        
        return {
            "success": True,
            "chunks_deleted": len(results['ids'])
        }
    
    def get_stats(self, user_id: str) -> Dict:
        """
        Get statistics about user's documents in RAG system
        
        Args:
            user_id: User ID
            
        Returns:
            Statistics dictionary
        """
        results = self.collection.get(
            where={"user_id": str(user_id)}
        )
        
        if not results or not results['ids']:
            return {
                "total_chunks": 0,
                "total_documents": 0,
                "documents": []
            }
        
        # Count unique documents
        doc_ids = set()
        doc_info = {}
        
        for metadata in results['metadatas']:
            doc_id = metadata.get('doc_id')
            doc_ids.add(doc_id)
            
            if doc_id not in doc_info:
                doc_info[doc_id] = {
                    "doc_id": doc_id,
                    "doc_name": metadata.get('doc_name'),
                    "doc_type": metadata.get('doc_type'),
                    "chunks": 0
                }
            doc_info[doc_id]["chunks"] += 1
        
        return {
            "total_chunks": len(results['ids']),
            "total_documents": len(doc_ids),
            "documents": list(doc_info.values())
        }


# Singleton instance
_rag_instance = None

def get_rag_service() -> RAGService:
    """Get or create RAG service singleton instance"""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGService()
    return _rag_instance
