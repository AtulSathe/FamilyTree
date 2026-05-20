using System.ComponentModel.DataAnnotations.Schema;

namespace FamilyTree.Api.Domain;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }

    /// <summary>Person | FamilyTree | Relationship | User</summary>
    public string EntityType { get; set; } = string.Empty;

    public Guid EntityId { get; set; }

    /// <summary>CREATE | UPDATE | DELETE</summary>
    public string Action { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? OldValue { get; set; } // JSON snapshot before change

    [Column(TypeName = "nvarchar(max)")]
    public string? NewValue { get; set; } // JSON snapshot after change

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
