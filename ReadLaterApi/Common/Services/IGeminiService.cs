namespace ReadLaterApi.Common.Services;

public record ArticleAnalysis(
    string Summary,
    List<string> Keywords
);

public interface IGeminiService
{
    Task<ArticleAnalysis> AnalyzeArticleAsync(string content);
}