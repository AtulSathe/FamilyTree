namespace FamilyTree.Api.Models;

public record SearchResultDto(
    Guid PersonId,
    string FullName,
    string? Location,
    string? BirthMonthYear,
    string? PhotoBlobUrl,
    Guid TreeId,
    string Surname
);
