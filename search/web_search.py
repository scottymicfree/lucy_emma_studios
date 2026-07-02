import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

class WebSearchEngine:
    """
    Real Web Search Engine (Local + External Hybrid).
    Handles real web searches, live webpage fetching, parsing, and structured extraction.
    """
    def __init__(self, llama_endpoint: str = "http://127.0.0.1:3000/v1/chat/completions"):
        self.llama_endpoint = llama_endpoint
        self.search_memory = []

    def _call_llama(self, system_prompt: str, user_prompt: str) -> str:
        data = {
            "model": "local-llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": False
        }
        req = urllib.request.Request(self.llama_endpoint, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
        except Exception:
            return ""

    def expand_query(self, query: str) -> List[str]:
        """Expands the query using local Llama to generate synonyms or sub-queries."""
        sys_prompt = "You are a search query expander. Given a query, provide 3 related search queries separated by commas. Output ONLY the queries."
        response = self._call_llama(sys_prompt, query)
        queries = [q.strip() for q in response.split(',')]
        if query not in queries:
            queries.insert(0, query)
        return queries

    def safety_filter(self, text: str) -> bool:
        """Basic safety filter to block malicious content."""
        unsafe_keywords = ["malware", "phishing", "illegal", "exploit"]
        return not any(kw in text.lower() for kw in unsafe_keywords)

    def rank_results(self, results: List[Dict[str, str]], query: str) -> List[Dict[str, str]]:
        """Ranks results based on simple term frequency relevance scoring."""
        query_terms = set(query.lower().split())
        for res in results:
            text = (res.get("title", "") + " " + res.get("snippet", "")).lower()
            score = sum(1 for term in query_terms if term in text)
            res["relevance_score"] = score
        results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        return results

    def search_web(self, query: str) -> List[Dict[str, str]]:
        """
        Performs a real web search, with query expansion and result ranking.
        """
        if not BeautifulSoup:
            return [{"title": "Error", "link": "", "snippet": "BeautifulSoup not installed. Cannot parse web."}]
            
        expanded_queries = self.expand_query(query)
        all_results = []
        
        for q in expanded_queries[:2]: # Limit to top 2 to save time
            url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(q)}"
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    html = response.read()
                    
                soup = BeautifulSoup(html, 'html.parser')
                for result in soup.find_all('div', class_='result'):
                    title_tag = result.find('a', class_='result__url')
                    snippet_tag = result.find('a', class_='result__snippet')
                    if title_tag and snippet_tag:
                        title = result.find('h2', class_='result__title').text.strip() if result.find('h2', class_='result__title') else "No title"
                        link = title_tag.get('href', '')
                        snippet = snippet_tag.text.strip()
                        if self.safety_filter(title + " " + snippet):
                            all_results.append({"title": title, "link": link, "snippet": snippet})
            except Exception:
                continue

        ranked_results = self.rank_results(all_results, query)
        # Deduplicate
        seen = set()
        unique_results = []
        for res in ranked_results:
            if res["link"] not in seen:
                seen.add(res["link"])
                unique_results.append(res)
                if len(unique_results) >= 5:
                    break
        
        self.search_memory.append({"query": query, "results": unique_results})
        return unique_results

    def multi_page_crawl(self, urls: List[str]) -> str:
        """Crawls multiple pages and aggregates text."""
        aggregated = ""
        for url in urls[:3]: # limit depth
            text = self.fetch_webpage(url)
            if self.safety_filter(text):
                aggregated += f"\\n--- Content from {url} ---\\n" + text[:3000]
        return aggregated

    def extract_structured_data(self, url: str) -> Dict[str, Any]:
        """Extracts structured data like JSON-LD, metadata, and citations from a page."""
        if not BeautifulSoup:
            return {}
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                html = response.read()
            soup = BeautifulSoup(html, 'html.parser')
            
            structured_data = []
            for script in soup.find_all('script', type='application/ld+json'):
                try:
                    structured_data.append(json.loads(script.string))
                except Exception:
                    pass
                    
            links = []
            for a in soup.find_all('a', href=True):
                if a['href'].startswith('http'):
                    links.append(a['href'])
                    
            return {
                "json_ld": structured_data,
                "title": soup.title.string if soup.title else "",
                "citations": list(set(links))[:20]
            }
        except Exception:
            return {}

    def fetch_webpage(self, url: str) -> str:
        """Fetches and extracts clean text from a live webpage."""
        if not BeautifulSoup:
            return "BeautifulSoup not installed."
            
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                html = response.read()
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove scripts and styles
            for script in soup(["script", "style", "header", "footer", "nav"]):
                script.decompose()
                
            text = soup.get_text(separator=' ', strip=True)
            # Truncate to avoid exploding context windows
            return text[:10000]
        except Exception as e:
            return f"Failed to fetch webpage: {str(e)}"

    def summarize_content(self, text: str, query: str) -> str:
        """Uses local Llama to summarize the extracted webpage content based on the query."""
        sys_prompt = "You are a research assistant. Summarize the provided text to extract information relevant to the user's query."
        user_prompt = f"Query: {query}\\n\\nText Content:\\n{text[:8000]}\\n\\nProvide a concise and highly relevant summary."
        return self._call_llama(sys_prompt, user_prompt)

    def search_and_summarize(self, query: str) -> str:
        """Full reasoning-chain routing for web search."""
        results = self.search_web(query)
        if not results or results[0]["title"] == "Error":
            return f"Search failed for '{query}'."
            
        top_result = results[0]
        page_content = self.fetch_webpage(top_result["link"])
        if "Failed to fetch" in page_content:
            return f"Found results, but failed to extract content from {top_result['link']}."
            
        summary = self.summarize_content(page_content, query)
        
        context = f"<web_context>\\nSource: {top_result['title']} ({top_result['link']})\\nSummary: {summary}\\n</web_context>"
        return context
