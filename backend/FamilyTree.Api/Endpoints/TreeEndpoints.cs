using FamilyTree.Api.Models;
using FamilyTree.Api.Services;

namespace FamilyTree.Api.Endpoints;

public static class TreeEndpoints
{
    public static void MapTreeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/trees").WithTags("Trees");

        group.MapGet("/",                                    ListTrees);
        group.MapPost("/",                                   CreateTree);
        group.MapGet("/{treeId:guid}/node/{personId:guid}",  GetNode);
        group.MapPost("/{treeId:guid}/relationships",        AddRelationship);
        group.MapPost("/{treeId:guid}/members/{personId:guid}", AddMember);
        group.MapDelete("/{treeId:guid}/members/{personId:guid}", RemoveMember);
    }

    private static async Task<IResult> ListTrees(TreeService svc) =>
        Results.Ok(await svc.ListAllAsync());

    private static async Task<IResult> CreateTree(
        CreateTreeRequest req, HttpContext ctx, TreeService svc)
    {
        if (!AuthHelper.IsPowerAdmin(ctx)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        var result = await svc.CreateAsync(req, actorId.Value);
        return Results.Created($"/api/v1/trees/{result.Id}", result);
    }

    private static async Task<IResult> GetNode(
        Guid treeId, Guid personId, int levels,
        TreeService svc)
    {
        var result = await svc.GetNodeAsync(treeId, personId, levels < 1 ? 1 : levels);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> AddRelationship(
        Guid treeId, CreateRelationshipRequest req,
        HttpContext ctx, TreeService svc)
    {
        if (!AuthHelper.CanEditTree(ctx, treeId)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        try
        {
            await svc.AddRelationshipAsync(treeId, req, actorId.Value);
            return Results.Created($"/api/v1/trees/{treeId}/relationships", null);
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { error = ex.Message });
        }
    }

    private static async Task<IResult> AddMember(
        Guid treeId, Guid personId, string role,
        HttpContext ctx, TreeService svc)
    {
        if (!AuthHelper.CanEditTree(ctx, treeId)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        await svc.AddMemberAsync(treeId, personId, role ?? "member", actorId.Value);
        return Results.NoContent();
    }

    private static async Task<IResult> RemoveMember(
        Guid treeId, Guid personId,
        HttpContext ctx, TreeService svc)
    {
        if (!AuthHelper.IsPowerAdmin(ctx)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        var removed = await svc.RemoveMemberAsync(treeId, personId, actorId.Value);
        return removed ? Results.NoContent() : Results.NotFound();
    }
}
