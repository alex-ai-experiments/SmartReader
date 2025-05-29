using Azure.Storage.Blobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Azure;
using ReadLaterApi.Common.Services;
using ReadLaterApi.Data;
using Serilog;

namespace ReadLaterApi;

public static class ConfigureServices
{
    public static void AddServices(this WebApplicationBuilder builder)
    {
        builder.AddSerilog();
        builder.AddDatabase();
        builder.Services.AddOpenApi();
        builder.AddStorageContainer();
    }
    
    private static void AddSerilog(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, configuration) =>
        {
            configuration.ReadFrom.Configuration(context.Configuration);
        });
    }
    private static void AddDatabase(this WebApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));
    }

    private static void AddStorageContainer(this WebApplicationBuilder builder)
    {
        var blobConnectionString = builder.Configuration.GetValue<string>("BlobStorage:ConnectionString")
                                   ?? throw new InvalidOperationException("BlobStorage:ConnectionString not found in configuration.");
        var blobContainerName = builder.Configuration.GetValue<string>("BlobStorage:ContainerName")
                                ?? throw new InvalidOperationException("BlobStorage:ContainerName not found in configuration.");
        
        builder.Services.AddSingleton(x => new BlobServiceClient(blobConnectionString));
        builder.Services.AddScoped<IBlobStorageService, BlobStorageService>();
    }
}