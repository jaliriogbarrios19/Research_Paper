import { AcademicWork } from "./types";

const OPENALEX_BASE = "https://api.openalex.org/works";

export async function fetchOpenAlex(
  query: string,
  email: string
): Promise<AcademicWork[]> {
  const params = new URLSearchParams({ search: query, mailto: email });
  const res = await fetch(`${OPENALEX_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
  const data = await res.json();

  return (data.results ?? []).map((w: any) => ({
    doi: w.doi ?? "",
    title: w.title ?? w.display_name ?? "",
    authors:
      w.authorships?.map((a: any) => ({
        name: a.author?.display_name ?? "",
      })) ?? [],
    year: w.publication_year ?? 0,
    journal: w.host_venue?.display_name ?? "",
    abstract_text: "",
    relevance_score: w.relevance_score ?? 0.5,
    url: w.doi ?? "",
    mesh_terms: [],
    reason: "",
  }));
}
