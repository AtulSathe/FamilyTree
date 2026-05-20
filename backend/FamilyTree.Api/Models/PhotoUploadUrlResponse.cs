namespace FamilyTree.Api.Models;

public record PhotoUploadUrlResponse(
    string SasUrl,
    string BlobName
);
