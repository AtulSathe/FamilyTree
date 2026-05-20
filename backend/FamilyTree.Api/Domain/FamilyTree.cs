namespace FamilyTree.Api.Domain;

public class FamilyTree
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Surname { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? CreatedByUser { get; set; }
    public ICollection<PersonTreeMembership> PersonMemberships { get; set; } = [];
    public ICollection<FamilyTreeAdmin> Admins { get; set; } = [];
}
