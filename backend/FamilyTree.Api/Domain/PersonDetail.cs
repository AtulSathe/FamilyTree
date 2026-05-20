using System.ComponentModel.DataAnnotations.Schema;

namespace FamilyTree.Api.Domain;

/// <summary>One-to-one, lazy-loaded on PersonDetailPage double-click.</summary>
public class PersonDetail
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PersonId { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Hobbies { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Education { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? Skills { get; set; }

    /// <summary>JSON array: [{title, company, start, end}]</summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Jobs { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? CustomFields { get; set; }

    public Person Person { get; set; } = null!;
}
