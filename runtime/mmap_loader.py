import numpy as np
import os

class ZeroCopyLoader:
    """
    Implements Zero-Copy Memory Mapping Blueprint.
    Maps binary weights file to memory as a flat array to save RAM.
    """
    def __init__(self, model_path="qwen3_1.7b_base.bin", vocab_size=151669, hidden_dim=2048):
        self.model_path = model_path
        self.vocab_size = vocab_size
        self.hidden_dim = hidden_dim
        
    def load_embeddings(self):
        if not os.path.exists(self.model_path):
            # Create a dummy file for testing if it doesn't exist
            print(f"Warning: {self.model_path} not found. Creating a dummy file for zero-copy mapping.")
            dummy_data = np.zeros(self.vocab_size * self.hidden_dim, dtype=np.float16)
            dummy_data.tofile(self.model_path)
            
        weights_mmap = np.memmap(
            self.model_path, 
            dtype=np.float16, 
            mode="r", 
            offset=0
        )
        
        # Extract the embedding projection weights
        embedding_matrix = weights_mmap[0:self.vocab_size * self.hidden_dim].reshape(self.vocab_size, self.hidden_dim)
        return embedding_matrix
