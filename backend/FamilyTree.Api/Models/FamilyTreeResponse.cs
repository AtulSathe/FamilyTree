namespace FamilyTree.Api.Models;

public record FamilyTreeResponse(
    Guid Id,
    string Surname,
    string? Description,
    int MemberCount
);
