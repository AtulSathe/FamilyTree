using FamilyTree.Api.Data;
using FamilyTree.Api.Domain;
using FamilyTree.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.Services;

public class UserService(AppDbContext db, AuditService audit)
{
    public async Task<List<UserResponse>> ListUsersAsync()
    {
        return await db.Users
            .Select(u => new UserResponse(u.Id, u.Email, u.FullName, u.Role))
            .ToListAsync();
    }

    public async Task<bool> UpdateRoleAsync(Guid id, string role, Guid actorId)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return false;

        var oldRole = user.Role;
        user.Role = role;
        await db.SaveChangesAsync();
        await audit.LogAsync(actorId, "User", id, "UPDATE",
            new { Role = oldRole }, new { Role = role });
        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid id, Guid actorId)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return false;

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        await audit.LogAsync(actorId, "User", id, "DELETE",
            new { user.Email, user.Role }, null);
        return true;
    }

    public async Task AssignAdminAsync(Guid treeId, Guid userId)
    {
        var existing = await db.FamilyTreeAdmins
            .FindAsync(treeId, userId);
        if (existing is not null) return;

        db.FamilyTreeAdmins.Add(new FamilyTreeAdmin
        {
            FamilyTreeId = treeId,
            UserId       = userId
        });
        await db.SaveChangesAsync();
    }
}
