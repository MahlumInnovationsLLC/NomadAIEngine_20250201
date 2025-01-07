import { db } from '@db';
import { documents, documentEmbeddings } from '@db/schema';
import { eq, sql } from 'drizzle-orm';

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
    where: eq(documents.id, documentId),
  });

  if (!document) return;

  // Split document into sections (e.g., paragraphs)
  const sections = document.content.split('\n\n');

  // Generate embeddings for each section
  for (const section of sections) {
    if (section.trim()) {
      const embedding = await generateEmbeddings(section);

      await db.insert(documentEmbeddings).values({
        documentId,
        embedding,
        section: section.slice(0, 100), // First 100 chars as section identifier
        sectionText: section,
      });
    }
  }

  // Update document's searchable text
  await db.update(documents)
    .set({ 
      searchableText: document.content,
      metadata: { 
        indexedAt: new Date().toISOString(),
        sectionCount: sections.length 
      }
    })
    .where(eq(documents.id, documentId));
}

export async function semanticSearch(query: string, limit: number = 5) {
  const queryEmbedding = await generateEmbeddings(query);

  // Perform similarity search using cosine similarity
  const results = await db.execute(sql`
    SELECT 
      d.id as document_id,
      d.title as document_title,
      de.section_text,
      1 - (de.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM document_embeddings de
    JOIN documents d ON d.id = de.document_id
    ORDER BY similarity DESC
    LIMIT ${limit}
  `);

  return results;
}

export async function reindexAllDocuments() {
  const allDocuments = await db.query.documents.findMany();

  for (const document of allDocuments) {
    await indexDocument(document.id);
  }
}