namespace ReadLaterApi.Articles.Endpoints;

public record CreateArticleRequest(string Title, string Url, string Content);