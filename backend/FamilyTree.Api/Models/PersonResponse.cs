namespace FamilyTree.Api.Models;

public record PersonResponse(
    Guid Id,
    string FullName,
    string? NameBefore,
    string? Phone,
    string? Location,
    string? BirthMonthYear,
    string? DeathMonthYear,
    string? PhotoBlobUrl,
    Guid? PrimaryTreeId
);
