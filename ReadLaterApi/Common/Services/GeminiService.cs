using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace ReadLaterApi.Common.Services;

public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";

    public GeminiService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"] ?? throw new InvalidOperationException("Gemini API key not configured");
    }

    public async Task<ArticleAnalysis> AnalyzeArticleAsync(string markdownContent)
    {
        if (string.IsNullOrWhiteSpace(markdownContent))
        {
            throw new ArgumentException("Markdown content cannot be null or empty", nameof(markdownContent));
        }

        var prompt = CreateAnalysisPrompt(markdownContent);
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            }
        };

        var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });
        var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{BaseUrl}?key={_apiKey}", httpContent);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Gemini API request failed: {response.StatusCode}. Response: {errorContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        return ParseGeminiResponse(responseContent);
    }

    private static string CreateAnalysisPrompt(string markdownContent)
    {
        return $@"Analyze the following Markdown-formatted article and provide the results in JSON format:

MARKDOWN ARTICLE:
{markdownContent}

Please provide your analysis in the following JSON structure:
{{
  ""summary"": ""A concise summary of 300-350 words"",
  ""keywords"": [""keyword1"", ""keyword2"", ""keyword3"", ""keyword4"", ""keyword5"", ""keyword6"", ""keyword7"", ""keyword8""]
}}

Requirements:
- Parse the Markdown content and focus on the actual text content (ignore formatting syntax like #, **, etc.)
- Summary: Exactly 300-350 words, capturing the main points and key information from the article content
- Keywords: Extract 6-8 most relevant keywords or key phrases from the actual content
- Language: If the text is in Romanian, respond in Romanian. Otherwise, keep the answer in English.
- Maintain awareness of Markdown structure (headings, emphasis, links, etc.) when analyzing content hierarchy and importance
- Return ONLY the JSON object, no additional text";
    }

    private static ArticleAnalysis ParseGeminiResponse(string responseContent)
    {
        try
        {
            var jsonOptions = new JsonDocumentOptions
            {
                AllowTrailingCommas = true,
                CommentHandling = JsonCommentHandling.Skip,
            };
            using var document = JsonDocument.Parse(responseContent, jsonOptions);
            var candidates = document.RootElement.GetProperty("candidates");
            var firstCandidate = candidates[0];
            var content = firstCandidate.GetProperty("content");
            var parts = content.GetProperty("parts");
            var text = parts[0].GetProperty("text").GetString();

            if (string.IsNullOrEmpty(text))
            {
                throw new InvalidOperationException("Empty response from Gemini API");
            }

            // Clean the response - remove any markdown code blocks if present
            text = text.Trim();
            if (text.StartsWith("```json"))
            {
                text = text.Substring(7);
            }
            if (text.EndsWith("```"))
            {
                text = text.Substring(0, text.Length - 3);
            }
            text = text.Trim();

            using var analysisDoc = JsonDocument.Parse(text);
            var root = analysisDoc.RootElement;

            var summary = root.GetProperty("summary").GetString() ?? "";
            
            var keywordsArray = root.GetProperty("keywords");
            var keywords = new List<string>();
            foreach (var keyword in keywordsArray.EnumerateArray())
            {
                if (keyword.GetString() is { } kw)
                    keywords.Add(kw);
            }

            return new ArticleAnalysis(summary, keywords);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Failed to parse Gemini response: {ex.Message}");
        }
    }
}