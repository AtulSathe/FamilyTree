using System.ComponentModel.DataAnnotations.Schema;

namespace FamilyTree.Api.Domain;

public class Person
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Display/admin hint — NOT used for membership queries (use PersonTreeMemberships)
    public Guid? PrimaryTreeId { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string? NameBefore { get; set; }    // maiden / pre-marriage surname
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? BirthMonthYear { get; set; } // e.g. "Jan 1952"
    public string? DeathMonthYear { get; set; }
    public string? PhotoBlobUrl { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? ExtendedFields { get; set; } // JSON

    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public FamilyTree? PrimaryTree { get; set; }
    public User? CreatedByUser { get; set; }
    public PersonDetail? Detail { get; set; }
    public ICollection<PersonTreeMembership> TreeMemberships { get; set; } = [];
}
