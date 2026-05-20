namespace FamilyTree.Api.Models;

public record RelationDto(
    Guid PersonId,
    string FullName,
    string? PhotoBlobUrl,
    string RelationshipType,   // spouse | parent_of | child_of | sibling_of | in_law_of | step_parent_of | adoptive_parent_of
    string Direction           // in | out | both
);
