export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const res = await fetch("/api/embedding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("Failed to generate embedding");
    const data = await res.json();
    return data.embedding;
  } catch (err) {
    console.error(err);
    // Fallback to empty if fails
    return new Array(384).fill(0);
  }
}
