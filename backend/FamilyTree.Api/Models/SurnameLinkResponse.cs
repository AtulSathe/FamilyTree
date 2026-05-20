namespace FamilyTree.Api.Models;

public record SurnameLinkResponse(
    string SurnameA,
    string SurnameB,
    Guid LinkPersonId,
    string LinkPersonName,
    int RelationshipLevel
);
