namespace FamilyTree.Api.Models;

public record PersonDetailResponse(
    Guid Id,
    string FullName,
    string? NameBefore,
    string? Phone,
    string? Location,
    string? BirthMonthYear,
    string? DeathMonthYear,
    string? PhotoBlobUrl,
    Guid? PrimaryTreeId,
    string? Hobbies,
    string? Education,
    string? Skills,
    List<JobDto> Jobs,
    Dictionary<string, object?>? CustomFields
);
