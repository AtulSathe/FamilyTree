using FamilyTree.Api.Data;
using FamilyTree.Api.Models;
using FamilyTree.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/admin").WithTags("Admin");

        group.MapGet("/users",                                  ListUsers);
        group.MapPut("/users/{id:guid}/role",                   UpdateUserRole);
        group.MapDelete("/users/{id:guid}",                     DeleteUser);
        group.MapPost("/trees/{treeId:guid}/admins/{userId:guid}", AssignAdmin);
        group.MapGet("/audit-log",                              GetAuditLog);
    }

    private static async Task<IResult> ListUsers(
        HttpContext ctx, UserService svc)
    {
        if (!AuthHelper.IsPowerAdmin(ctx)) return AuthHelper.Forbid();
        return Results.Ok(await svc.ListUsersAsync());
    }

    private static async Task<IResult> UpdateUserRole(
        Guid id, UpdateRoleRequest req,
        HttpContext ctx, UserService svc)
    {
        if (!AuthHelper.IsPowerAdmin(ctx)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        var updated = await svc.UpdateRoleAsync(id, req.Role, actorId.Value);
        return updated ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> DeleteUser(
        Guid id, HttpContext ctx, UserService svc)
    {
        if (!AuthHelper.IsPowerAdmin(ctx)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        var deleted = await svc.DeleteUserAsync(id, actorId.Value);
        return deleted ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> AssignAdmin(
        Guid treeId, Guid userId,
        HttpContext ctx, UserService svc)
    {
        if (!AuthHelper.IsPowerAdmin(ctx)) return AuthHelper.Forbid();
        await svc.AssignAdminAsync(treeId, userId);
        return Results.NoContent();
    }

    private static async Task<IResult> GetAuditLog(
        HttpContext ctx, AppDbContext db,
        int page = 1, int pageSize = 50)
    {
        if (!AuthHelper.IsPowerAdmin(ctx)) return AuthHelper.Forbid();

        pageSize = Math.Clamp(pageSize, 1, 200);
        page     = Math.Max(page, 1);

        var total = await db.AuditLog.CountAsync();
        var items = await db.AuditLog
            .OrderByDescending(a => a.ChangedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogResponse(
                a.Id, a.UserId, a.EntityType, a.EntityId,
                a.Action, a.OldValue, a.NewValue, a.ChangedAt))
            .ToListAsync();

        return Results.Ok(new { total, page, pageSize, items });
    }
}
