/** A source document cited in an assistant answer. */
export interface Citation {
  sourceId: string;
  title: string;
  /** Excerpt of the relevant passage. */
  excerpt?: string;
  /** Page or section reference within the source document. */
  location?: string;
}
