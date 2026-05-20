namespace FamilyTree.Api.Models;

public record UpdatePersonRequest(
    string? FullName,
    string? NameBefore,
    string? Phone,
    string? Location,
    string? BirthMonthYear,
    string? DeathMonthYear,
    string? PhotoBlobUrl,
    string? Hobbies,
    string? Education,
    string? Skills,
    List<JobDto>? Jobs,
    Dictionary<string, object?>? CustomFields
);
