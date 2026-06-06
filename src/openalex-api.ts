import { requestUrl } from "obsidian";
import { AcademicWork } from "./types";

const OPENALEX_BASE = "https://api.openalex.org/works";

export async function fetchOpenAlex(
  query: string,
  email: string
): Promise<AcademicWork[]> {
  const params = new URLSearchParams({ search: query, mailto: email });
  const res = await requestUrl({ url: `${OPENALEX_BASE}?${params.toString()}` });
  if (res.status < 200 || res.status >= 300) throw new Error(`OpenAlex HTTP ${res.status}`);
  const data = res.json as {
    results?: Array<{
      doi?: string;
      title?: string;
      display_name?: string;
      authorships?: Array<{ author?: { display_name?: string } }>;
      publication_year?: number;
      host_venue?: { display_name?: string };
      relevance_score?: number;
    }>;
  };

  return (data.results ?? []).map((w) => ({
    doi: w.doi ?? "",
    title: w.title ?? w.display_name ?? "",
    authors:
      w.authorships?.map((a) => ({
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
