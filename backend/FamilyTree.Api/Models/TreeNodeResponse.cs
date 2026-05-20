namespace FamilyTree.Api.Models;

public record TreeNodeResponse(
    PersonResponse Person,
    List<RelationDto> Relations
);
