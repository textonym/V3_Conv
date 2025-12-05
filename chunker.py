import base64
import pandas as pd
import math

# --- CONFIGURATION ---
INPUT_FILE = "model_v1.frag"  # Your file name
OUTPUT_CSV = "model_data.csv"
CHUNK_SIZE = 30000 # Safe limit for Power BI cells

def convert_to_chunks():
    print(f"Reading {INPUT_FILE}...")
    
    # 1. Read Binary
    with open(INPUT_FILE, "rb") as f:
        binary_data = f.read()
    
    # 2. Convert to Base64 String
    base64_string = base64.b64encode(binary_data).decode('utf-8')
    total_length = len(base64_string)
    print(f"Total Base64 Length: {total_length} characters")

    # 3. Create Chunks
    chunks = []
    num_chunks = math.ceil(total_length / CHUNK_SIZE)
    
    for i in range(num_chunks):
        start = i * CHUNK_SIZE
        end = start + CHUNK_SIZE
        chunk = base64_string[start:end]
        # We store Index to ensure correct sort order in Power BI
        chunks.append({"Index": i, "DataChunk": chunk})

    # 4. Save to CSV
    df = pd.DataFrame(chunks)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"✅ Success! Saved {len(chunks)} rows to {OUTPUT_CSV}")

if __name__ == "__main__":
    convert_to_chunks()