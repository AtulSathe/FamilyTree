namespace FamilyTree.Api.Domain;

/// <summary>
/// Records which trees a person appears in and in what capacity.
/// A person born in Panse who marries into Sathe gets two rows: one per tree.
/// </summary>
public class PersonTreeMembership
{
    public Guid PersonId { get; set; }
    public Guid FamilyTreeId { get; set; }

    /// <summary>member | married_in | admin_linked</summary>
    public string Role { get; set; } = "member";

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public Guid? AddedBy { get; set; }

    public Person Person { get; set; } = null!;
    public FamilyTree FamilyTree { get; set; } = null!;
    public User? AddedByUser { get; set; }
}
