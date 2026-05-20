using System.ComponentModel.DataAnnotations;

namespace FamilyTree.Api.Models;

public record CreateRelationshipRequest(
    [Required] Guid PersonAId,
    [Required] Guid PersonBId,
    // spouse | parent_of | child_of | sibling_of | in_law_of | step_parent_of | adoptive_parent_of
    [Required] string RelationshipType
);
