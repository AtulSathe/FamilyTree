using System.ComponentModel.DataAnnotations;

namespace FamilyTree.Api.Models;

public record UpdateRoleRequest(
    // power_admin | family_admin | community_member
    [Required] string Role
);
