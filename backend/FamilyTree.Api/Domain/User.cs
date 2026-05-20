namespace FamilyTree.Api.Domain;

public class User
{
    /// <summary>Matches Azure AD B2C object ID.</summary>
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }

    /// <summary>power_admin | family_admin | community_member</summary>
    public string Role { get; set; } = "community_member";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<FamilyTreeAdmin> AdminTrees { get; set; } = [];
}
