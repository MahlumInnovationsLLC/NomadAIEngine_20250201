import { db } from '@db';
import { documents } from '@db/schema';
import { eq, sql, like } from 'drizzle-orm';

export async function generateEmbeddings(text: string): Promise<number[]> {
  // Simple TF-IDF-like approach for demonstration
  const words = text.toLowerCase().split(/\W+/);
  const vector = new Array(100).fill(0); // Fixed-size vector

  // Generate a simple numerical representation
  words.forEach((word, index) => {
    const hash = word.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    vector[Math.abs(hash) % vector.length] += 1;
  });

  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
  return vector.map(val => magnitude === 0 ? 0 : val / magnitude);
}

export async function indexDocument(documentId: number) {
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId)
  });

  if (!document) return;

  // Update document's searchable text
  await db.update(documents)
    .set({ 
      searchableText: document.content,
      metadata: { 
        indexedAt: new Date().toISOString()
      }
    })
    .where(eq(documents.id, documentId));
}

export async function semanticSearch(query: string, limit: number = 5) {
  // Simple text-based search implementation
  const results = await db.query.documents.findMany({
    where: sql`${documents.searchableText} ILIKE ${`%${query}%`}`,
    limit,
  });

  return results.map(doc => ({
    document_id: doc.id,
    document_title: doc.title,
    section_text: doc.content.substring(0, 200), // First 200 chars as preview
    similarity: 1.0 // Placeholder similarity score
  }));
}

export async function reindexAllDocuments() {
  const allDocuments = await db.query.documents.findMany();
  for (const document of allDocuments) {
    await indexDocument(document.id);
  }
}