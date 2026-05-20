namespace FamilyTree.Api.Models;

public record AuditLogResponse(
    Guid Id,
    Guid? UserId,
    string EntityType,
    Guid EntityId,
    string Action,
    string? OldValue,
    string? NewValue,
    DateTime ChangedAt
);
