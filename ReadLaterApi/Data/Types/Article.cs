namespace ReadLaterApi.Models;

public class Article
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTime SavedAtUtc { get; set; }
    public bool IsRead { get; set; }
    public string BlobGuid { get; set; } = string.Empty;
    
    public string? TextSummary { get; set; }
    
    public string? Keywords { get; set; } 
    
    // public string? NamedEntities { get; set; }
}