import torch
from torch.utils.data import Dataset, DataLoader

import re

class LucyBPE:
    def __init__(self, vocab_size=151669):
        self.vocab_size = vocab_size
        self.merges = {}  # Map of (int, int) -> int (learned merges)
        # Initialize base vocabulary with 256 UTF-8 bytes
        self.vocab = {i: bytes([i]) for i in range(256)}
        
        # Operational Control Tokens allocated at the end of the vocabulary
        # 151643 to 151668
        self.special_tokens = {
            "<|endoftext|>": 151643,
            "<|im_start|>": 151644,
            "<|im_end|>": 151645
        }
        
        # Pre-Tokenization Regular Expression Blueprint (fallback to standard \w+ if regex module not present, but using basic python re pattern for grouping)
        # This groups letters, numbers, punctuation, and whitespace into clean blocks
        self.pre_tokenize_pat = re.compile(r"""'(?i:[sdmt]|ll|ve|re)|[a-zA-Z]+|[0-9]{1,3}| ?[^\sA-Za-z0-9]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+""")

    def _pre_tokenize(self, text):
        """Splits raw text into distinct semantic segments to prevent incorrect merging across boundaries."""
        return re.findall(self.pre_tokenize_pat, text)
        
    def _get_stats(self, tokens):
        """Count frequencies of adjacent token pairs."""
        stats = {}
        for pair in zip(tokens, tokens[1:]):
            stats[pair] = stats.get(pair, 0) + 1
        return stats

    def _merge_tokens(self, tokens, pair, new_id):
        """Replace all occurrences of a token pair with a new token ID."""
        new_tokens = []
        idx = 0
        while idx < len(tokens):
            if idx < len(tokens) - 1 and (tokens[idx], tokens[idx+1]) == pair:
                new_tokens.append(new_id)
                idx += 2
            else:
                new_tokens.append(tokens[idx])
                idx += 1
        return new_tokens

    def train(self, text, verbose=False):
        """Train the BPE tokenizer on a raw text corpus."""
        # Pre-tokenize the raw text into segments to prevent cross-category merging
        segments = self._pre_tokenize(text)
        
        # Convert segments to bytes
        token_lists = [list(segment.encode("utf-8")) for segment in segments]
        
        num_merges = self.vocab_size - 256
        
        for i in range(num_merges):
            stats = {}
            # Get stats per segment to ensure boundaries aren't crossed
            for tokens in token_lists:
                segment_stats = self._get_stats(tokens)
                for pair, count in segment_stats.items():
                    stats[pair] = stats.get(pair, 0) + count
                    
            if not stats:
                break
                
            # Optimization: Heap-Based Merge Iteration
            # Note: A production system maintains a priority queue (heapq) of pairs
            # to reduce the argmax scan complexity from O(P) to O(log P).
            # Find the most frequent contiguous pair
            best_pair = max(stats, key=stats.get)
            new_id = 256 + i
            
            # Record the merge rules and update vocabulary representation
            self.merges[best_pair] = new_id
            self.vocab[new_id] = self.vocab[best_pair[0]] + self.vocab[best_pair[1]]
            
            # Apply the merge to all segments
            token_lists = [self._merge_tokens(tokens, best_pair, new_id) for tokens in token_lists]
            
            if verbose:
                print(f"Iteration {i+1}/{num_merges}: Merged {best_pair} -> Token ID {new_id}")
                
    def encode(self, text):
        """Encode raw text into token IDs using learned merges."""
        segments = self._pre_tokenize(text)
        final_tokens = []
        
        for segment in segments:
            tokens = list(segment.encode("utf-8"))
            while len(tokens) >= 2:
                stats = {}
                for pair in zip(tokens, tokens[1:]):
                    if pair in self.merges:
                        stats[pair] = self.merges[pair]
                if not stats:
                    break  # No merge rules apply to current sequence
                    
                # Always apply the earliest learned merge (lowest merge rank)
                pair_to_merge = min(stats, key=stats.get)
                new_id = self.merges[pair_to_merge]
                tokens = self._merge_tokens(tokens, pair_to_merge, new_id)
            final_tokens.extend(tokens)
            
        return final_tokens

    def decode(self, ids):
        """Decode a list of token IDs back into readable UTF-8 text."""
        part_bytes = []
        for token_id in ids:
            if token_id in self.vocab:
                part_bytes.append(self.vocab[token_id])
        byte_stream = b"".join(part_bytes)
        # Decode bytes with a fallback to replace corrupt/malformed bytes
        return byte_stream.decode("utf-8", errors="replace")


class LucyPackedDataset(Dataset):
    def __init__(self, texts, tokenizer, block_size):
        """
        A PyTorch Dataset that concatenates and packs all tokenized inputs 
        into continuous, equal-sized chunks of context window size (block_size).
        """
        self.block_size = block_size
        all_tokens = []
        
        # Tokenize and chain all raw texts into one contiguous stream
        for text in texts:
            tokens = tokenizer.encode(text)
            all_tokens.extend(tokens)
            
        self.tokens = torch.tensor(all_tokens, dtype=torch.long)
        
    def __len__(self):
        # We need block_size tokens for inputs, and block_size tokens shifted by 1 for target
        return (len(self.tokens) - 1) // self.block_size
        
    def __getitem__(self, idx):
        # Calculate start and end indexes for slicing the packed 1D stream
        start_idx = idx * self.block_size
        end_idx = start_idx + self.block_size
        
        # x is the input context window
        x = self.tokens[start_idx : end_idx]
        # y is the next-token prediction target (x shifted by 1)
        y = self.tokens[start_idx + 1 : end_idx + 1]
        
        return x, y


if __name__ == "__main__":
    # 1. Prepare raw text data (The local training corpus)
    training_corpus = [
        "Lucy, you are an independent artificial general intelligence core.",
        "To think and learn, you must adapt your dynamic weight matrices.",
        "By utilizing test-time training, you can consolidate real-time interactions.",
        "Your cognitive systems scale linearly with context length to process inputs efficiently."
    ]

    # 2. Initialize and Train the Vocabulary Engine
    # We set target vocab_size to 280 (256 base bytes + 24 learned merges)
    lucy_tokenizer = LucyBPE(vocab_size=280)
    print("Training Lucy's Vocabulary Engine...")
    
    # We concatenate the corpus to learn optimal merges
    full_text = " ".join(training_corpus)
    lucy_tokenizer.train(full_text, verbose=True)
    
    print("\nVocabulary Engine trained successfully!")
    print(f"Total entries in vocabulary: {len(lucy_tokenizer.vocab)}")

    # 3. Verify Encoding and Decoding loop
    sample_text = "Lucy, learn and think!"
    encoded_ids = lucy_tokenizer.encode(sample_text)
    decoded_text = lucy_tokenizer.decode(encoded_ids)
    
    print(f"\nVerification test:")
    print(f"Original Text: '{sample_text}'")
    print(f"Encoded Token IDs: {encoded_ids}")
    print(f"Decoded Output:   '{decoded_text}'")
    
    # 4. Construct the Packed Data Engine
    # Let's assume Lucy's model context window block_size (T) is 8 tokens
    block_size = 8
    print(f"\nBuilding Data Engine with packed token blocks of size {block_size}...")
    
    lucy_dataset = LucyPackedDataset(training_corpus, lucy_tokenizer, block_size=block_size)
    lucy_loader = DataLoader(lucy_dataset, batch_size=2, shuffle=True)
    
    print(f"Total packed samples created: {len(lucy_dataset)}")
    
    # 5. Extract a batch of packed data
    for batch_idx, (batch_x, batch_y) in enumerate(lucy_loader):
        print(f"\n--- Batch {batch_idx + 1} ---")
        print(f"Inputs (x):\n{batch_x}")
        print(f"Targets (y):\n{batch_y}")
        print("Decoded inputs in batch:")
        for sequence in batch_x:
            print(f" -> '{lucy_tokenizer.decode(sequence.tolist())}'")
