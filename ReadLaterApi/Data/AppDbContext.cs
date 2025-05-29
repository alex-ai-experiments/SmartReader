using Microsoft.EntityFrameworkCore;
using ReadLaterApi.Models;

namespace ReadLaterApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Article> Articles { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ConfigureArticlesTable(modelBuilder);
    }

    private static void ConfigureArticlesTable(ModelBuilder modelBuilder)
    {
        var articleEntity = modelBuilder.Entity<Article>();
        
        articleEntity.Property(a => a.Title).HasMaxLength(255).IsRequired();
        articleEntity.Property(a => a.Url).HasMaxLength(2048).IsRequired();
    }
}