using System.Security.Claims;

namespace FamilyTree.Api.Endpoints;

/// <summary>Reads JWT / mock-auth claims injected by MockAuthMiddleware or Azure AD B2C.</summary>
internal static class AuthHelper
{
    internal static Guid? GetUserId(HttpContext ctx) =>
        Guid.TryParse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    internal static string GetRole(HttpContext ctx) =>
        ctx.User.FindFirstValue("extension_Role") ?? string.Empty;

    internal static bool IsPowerAdmin(HttpContext ctx) =>
        GetRole(ctx) == "power_admin";

    internal static bool CanMutate(HttpContext ctx) =>
        GetRole(ctx) is "power_admin" or "family_admin";

    /// <summary>True when the actor is power_admin OR is a family_admin assigned to treeId.</summary>
    internal static bool CanEditTree(HttpContext ctx, Guid treeId)
    {
        var role = GetRole(ctx);
        if (role == "power_admin") return true;
        if (role != "family_admin") return false;

        var assigned = ctx.User.FindFirstValue("extension_AssignedTrees") ?? string.Empty;
        return assigned.Split(',', StringSplitOptions.RemoveEmptyEntries)
                       .Contains(treeId.ToString());
    }

    internal static IResult Forbid() => Results.Json(
        new { error = "Forbidden" }, statusCode: 403);

    internal static IResult Unauthorized() => Results.Json(
        new { error = "Unauthorized" }, statusCode: 401);
}
