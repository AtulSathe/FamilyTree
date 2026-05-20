namespace FamilyTree.Api.Domain;

/// <summary>Maps which users are admins of which family trees.</summary>
public class FamilyTreeAdmin
{
    public Guid FamilyTreeId { get; set; }
    public Guid UserId { get; set; }

    public FamilyTree FamilyTree { get; set; } = null!;
    public User User { get; set; } = null!;
}
