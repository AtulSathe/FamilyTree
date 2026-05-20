using System.Text.Json;
using FamilyTree.Api.Data;
using FamilyTree.Api.Domain;

namespace FamilyTree.Api.Services;

public class AuditService(AppDbContext db)
{
    /// <summary>Serialize old/new values and append an AuditLog row.</summary>
    public async Task LogAsync(
        Guid? userId,
        string entityType,
        Guid entityId,
        string action,
        object? oldValue,
        object? newValue)
    {
        db.AuditLog.Add(new AuditLog
        {
            UserId     = userId,
            EntityType = entityType,
            EntityId   = entityId,
            Action     = action,
            OldValue   = oldValue is null ? null : JsonSerializer.Serialize(oldValue),
            NewValue   = newValue is null ? null : JsonSerializer.Serialize(newValue),
            ChangedAt  = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
