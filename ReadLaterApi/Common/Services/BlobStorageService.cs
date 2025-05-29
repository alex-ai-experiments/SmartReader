using System.Text;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ReadLaterApi.Common.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName = "articles";
    
    public BlobStorageService(BlobServiceClient blobServiceClient)
    {
        _blobServiceClient = blobServiceClient;
    }
    public async Task<Uri> UploadArticle(string content, string blobName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobClient = containerClient.GetBlobClient(blobName);
        using var memoryStream =
            new MemoryStream(Encoding.UTF8.GetBytes(content ?? string.Empty)); // Handle null content

        var options = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = "text/markdown" }
        };

        Response<BlobContentInfo> response = await blobClient.UploadAsync(memoryStream, options);
        
        return blobClient.Uri;
    }
}