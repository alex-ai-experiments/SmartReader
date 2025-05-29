using Azure.Storage;
using Azure.Storage.Blobs;
using ReadLaterApi.Articles.Endpoints;

namespace ReadLaterApi.Common.Services;

public interface IBlobStorageService
{
    Task<Uri> UploadArticle(string content, string blobName);
}