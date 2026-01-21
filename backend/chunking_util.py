"""
Document chunking utility for RAG system
Splits large documents into semantic chunks with context overlap
"""

import tiktoken
from typing import List, Dict
import re


class DocumentChunker:
    """Intelligent document chunking with overlap and semantic boundaries"""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        """
        Initialize chunker
        
        Args:
            chunk_size: Target size of each chunk in tokens
            chunk_overlap: Number of tokens to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        # Use cl100k_base encoding (GPT-3.5/4 tokenizer)
        try:
            self.encoding = tiktoken.get_encoding("cl100k_base")
        except:
            # Fallback to approximate token counting if tiktoken fails
            self.encoding = None
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        if self.encoding:
            return len(self.encoding.encode(text))
        else:
            # Rough approximation: 1 token ≈ 4 characters
            return len(text) // 4
    
    def split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences while preserving boundaries"""
        # Simple sentence splitter (handles common cases)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def chunk_text(self, text: str, metadata: Dict = None) -> List[Dict]:
        """
        Split text into chunks with overlap
        
        Args:
            text: Text to chunk
            metadata: Optional metadata to attach to each chunk
            
        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text or not text.strip():
            return []
        
        metadata = metadata or {}
        sentences = self.split_into_sentences(text)
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for sentence in sentences:
            sentence_tokens = self.count_tokens(sentence)
            
            # If adding this sentence exceeds chunk size, save current chunk
            if current_tokens + sentence_tokens > self.chunk_size and current_chunk:
                chunk_text = " ".join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "tokens": current_tokens,
                    "chunk_index": len(chunks),
                    **metadata
                })
                
                # Start new chunk with overlap
                # Keep last few sentences for context
                overlap_text = chunk_text
                overlap_tokens = current_tokens
                overlap_sentences = []
                
                # Build overlap from end of previous chunk
                for s in reversed(current_chunk):
                    s_tokens = self.count_tokens(s)
                    if overlap_tokens - s_tokens >= self.chunk_overlap:
                        break
                    overlap_sentences.insert(0, s)
                    overlap_tokens -= s_tokens
                
                current_chunk = overlap_sentences + [sentence]
                current_tokens = self.count_tokens(" ".join(current_chunk))
            else:
                current_chunk.append(sentence)
                current_tokens += sentence_tokens
        
        # Add final chunk
        if current_chunk:
            chunks.append({
                "text": " ".join(current_chunk),
                "tokens": current_tokens,
                "chunk_index": len(chunks),
                **metadata
            })
        
        return chunks
    
    def chunk_document(self, text: str, doc_id: str, user_id: str, 
                      doc_name: str = None, doc_type: str = None) -> List[Dict]:
        """
        Chunk a complete document with full metadata
        
        Args:
            text: Document text
            doc_id: Document ID
            user_id: User ID who owns the document
            doc_name: Document filename
            doc_type: Document type (legal, financial, etc.)
            
        Returns:
            List of chunks with complete metadata
        """
        metadata = {
            "doc_id": doc_id,
            "user_id": user_id,
            "doc_name": doc_name or "unknown",
            "doc_type": doc_type or "other"
        }
        
        chunks = self.chunk_text(text, metadata)
        
        # Add total chunks count to each chunk
        total_chunks = len(chunks)
        for chunk in chunks:
            chunk["total_chunks"] = total_chunks
        
        return chunks


# Global instance
_chunker_instance = None

def get_chunker() -> DocumentChunker:
    """Get or create singleton chunker instance"""
    global _chunker_instance
    if _chunker_instance is None:
        _chunker_instance = DocumentChunker()
    return _chunker_instance
