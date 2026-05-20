namespace FamilyTree.Api.Domain;

/// <summary>
/// Pre-computed nightly cross-tree surname connection via marriage edges.
/// Graph hop count between two surname roots.
/// </summary>
public class SurnameLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SurnameA { get; set; } = string.Empty;
    public string SurnameB { get; set; } = string.Empty;
    public Guid LinkPersonId { get; set; }
    public int RelationshipLevel { get; set; }
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;

    public Person LinkPerson { get; set; } = null!;
}
