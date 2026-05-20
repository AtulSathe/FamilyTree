namespace FamilyTree.Api.Models;

public record SurnameResponse(
    string Surname,
    Guid TreeId,
    int MemberCount
);
