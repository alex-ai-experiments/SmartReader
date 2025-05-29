namespace ReadLaterApi.Common.Services;

public record ArticleAnalysis(
    string Summary,
    List<string> Keywords
    // List<NamedEntity> NamedEntities
);

// public record NamedEntity(
//     string Text,
//     string Type,
//     int StartPosition,
//     int EndPosition
// );

public interface IGeminiService
{
    Task<ArticleAnalysis> AnalyzeArticleAsync(string content);
}