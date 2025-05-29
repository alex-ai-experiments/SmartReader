using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReadLaterApi;
using ReadLaterApi.Articles.Endpoints;
using ReadLaterApi.Common.Services;
using ReadLaterApi.Data;
using ReadLaterApi.Models;
using Scalar.AspNetCore;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.AddServices();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.MapGet("/articles", async (AppDbContext db) => await db.Articles.ToListAsync())
    .WithName("GetAllArticles")
    .WithTags("Articles");

app.MapPost("/article", async (
    AppDbContext db, 
    [FromBody] CreateArticleRequest articleReq, 
    IBlobStorageService blobService,
    IGeminiService geminiService) =>
{
    var articleId = Guid.NewGuid();
    var blobName = $"{articleId}.md";

    try
    {
        // Upload article content to blob storage
        var blobUri = await blobService.UploadArticle(articleReq.Content, blobName);
    }
    catch (Exception)
    {
        return Results.Problem(
            detail: "Error uploading article to blob storage",
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Blob Storage Error");
    }

    // Analyze article content with Gemini
    ArticleAnalysis analysis;
    try
    {
        analysis = await geminiService.AnalyzeArticleAsync(articleReq.Content);
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: $"Error analyzing article content: {ex.Message}",
            statusCode: StatusCodes.Status500InternalServerError,
            title: "AI Analysis Error");
    }
    
    var article = new Article()
    {
        Title = articleReq.Title,
        Url = articleReq.Url,
        SavedAtUtc = DateTime.UtcNow,
        IsRead = false,
        BlobGuid = blobName,
        TextSummary = analysis.Summary,
        Keywords = JsonSerializer.Serialize(analysis.Keywords, new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        }),
        // NamedEntities = JsonSerializer.Serialize(analysis.NamedEntities)
    };

    try
    {
        await db.Articles.AddAsync(article);
        await db.SaveChangesAsync();
    }
    catch (Exception)
    {
        return Results.Problem(
            detail: "Error saving article to database",
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Database Error");
    }
    
    return Results.Created($"/articles/{article.Id}", article);
})
.WithName("CreateArticle")
.WithTags("Articles");

app.Run();