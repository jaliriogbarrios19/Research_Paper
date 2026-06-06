import { requestUrl } from "obsidian";
import { AcademicWork } from "./types";

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function fetchPubMed(
  query: string,
  apiKey: string
): Promise<AcademicWork[]> {
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmode: "json",
    retmax: "10",
  });
  if (apiKey) params.set("api_key", apiKey);

  const searchRes = await requestUrl({
    url: `${PUBMED_BASE}/esearch.fcgi?${params.toString()}`,
  });
  if (searchRes.status < 200 || searchRes.status >= 300) throw new Error(`PubMed HTTP ${searchRes.status}`);
  const searchData = searchRes.json as { esearchresult?: { idlist?: string[] } };
  const ids: string[] = searchData.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryParams = new URLSearchParams({
    db: "pubmed",
    id: ids.join(","),
    retmode: "json",
  });
  if (apiKey) summaryParams.set("api_key", apiKey);

  const sumRes = await requestUrl({
    url: `${PUBMED_BASE}/esummary.fcgi?${summaryParams.toString()}`,
  });
  if (sumRes.status < 200 || sumRes.status >= 300) throw new Error(`PubMed summary HTTP ${sumRes.status}`);
  const sumData = sumRes.json as {
    result?: Record<
      string,
      {
        articleids?: Array<{ idtype: string; value: string }>;
        title?: string;
        authors?: Array<{ name: string }>;
        pubdate?: string;
        fulljournalname?: string;
      }
    >;
  };

  const abstracts = await fetchAbstracts(ids, apiKey);

  const works: AcademicWork[] = [];
  for (const id of ids) {
    const article = sumData.result?.[id];
    if (!article) continue;
    const doi =
      article.articleids?.find((a: { idtype: string }) => a.idtype === "doi")
        ?.value ?? "";
    works.push({
      doi: doi ? `https://doi.org/${doi}` : "",
      title: article.title ?? "",
      authors:
        article.authors?.map((a: { name: string }) => ({ name: a.name })) ??
        [],
      year: parseInt(article.pubdate?.split(" ")[0] ?? "0") || 0,
      journal: article.fulljournalname ?? "",
      abstract_text: abstracts.get(id) ?? "",
      relevance_score: 0.9,
      url: doi
        ? `https://doi.org/${doi}`
        : `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      mesh_terms: [],
      reason: "",
    });
  }
  return works;
}

async function fetchAbstracts(
  ids: string[],
  apiKey: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const params = new URLSearchParams({
      db: "pubmed",
      id: ids.join(","),
      retmode: "xml",
      rettype: "abstract",
    });
    if (apiKey) params.set("api_key", apiKey);

    const res = await requestUrl({
      url: `${PUBMED_BASE}/efetch.fcgi?${params.toString()}`,
    });
    if (res.status < 200 || res.status >= 300) return result;

    const xml = res.text;
    const abstractRegex =
      /<PubmedArticle>[\s\S]*?<PMID[^>]*>(\d+)<\/PMID>[\s\S]*?<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi;

    let match;
    while ((match = abstractRegex.exec(xml)) !== null) {
      const pmid = match[1];
      const abstract = match[2]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (abstract) result.set(pmid, abstract);
    }
  } catch {
    // EFetch failure is non-fatal — return empty abstracts
  }
  return result;
}
