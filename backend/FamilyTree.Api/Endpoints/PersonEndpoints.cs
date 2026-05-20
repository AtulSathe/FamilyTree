using FamilyTree.Api.Data;
using FamilyTree.Api.Models;
using FamilyTree.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.Endpoints;

public static class PersonEndpoints
{
    public static void MapPersonEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/persons").WithTags("Persons");

        // Must be registered before /{id} to avoid route ambiguity
        group.MapGet("/search-existing", SearchExisting);
        group.MapGet("/{id:guid}", GetById);
        group.MapGet("/{id:guid}/detail", GetDetail);
        group.MapPost("/", Create);
        group.MapPut("/{id:guid}", Update);
        group.MapDelete("/{id:guid}", Delete);
        group.MapPost("/{id:guid}/photo-upload-url", GetPhotoUploadUrl);
    }

    private static async Task<IResult> GetById(
        Guid id, PersonService svc)
    {
        var result = await svc.GetByIdAsync(id);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> GetDetail(
        Guid id, PersonService svc)
    {
        var result = await svc.GetDetailAsync(id);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> SearchExisting(
        string q, string? surname,
        HttpContext ctx, SearchService search)
    {
        if (!AuthHelper.CanMutate(ctx)) return AuthHelper.Forbid();
        var results = await search.SearchAsync(q, surname);
        return Results.Ok(results);
    }

    private static async Task<IResult> Create(
        CreatePersonRequest req,
        HttpContext ctx, PersonService svc)
    {
        if (!AuthHelper.CanMutate(ctx)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        if (!AuthHelper.IsPowerAdmin(ctx) && !AuthHelper.CanEditTree(ctx, req.TreeId))
            return AuthHelper.Forbid();

        var result = await svc.CreateAsync(req, actorId.Value);
        return Results.Created($"/api/v1/persons/{result.Id}", result);
    }

    private static async Task<IResult> Update(
        Guid id, UpdatePersonRequest req,
        HttpContext ctx, PersonService svc, AppDbContext db)
    {
        if (!AuthHelper.CanMutate(ctx)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        // family_admin: verify actor manages at least one tree this person belongs to
        if (!AuthHelper.IsPowerAdmin(ctx))
        {
            var assigned = (ctx.User.FindFirst("extension_AssignedTrees")?.Value ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries);
            var personTrees = await db.PersonTreeMemberships
                .Where(m => m.PersonId == id)
                .Select(m => m.FamilyTreeId.ToString())
                .ToListAsync();
            if (!personTrees.Any(t => assigned.Contains(t)))
                return AuthHelper.Forbid();
        }

        var result = await svc.UpdateAsync(id, req, actorId.Value);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> Delete(
        Guid id, HttpContext ctx, PersonService svc)
    {
        if (!AuthHelper.IsPowerAdmin(ctx)) return AuthHelper.Forbid();
        var actorId = AuthHelper.GetUserId(ctx);
        if (actorId is null) return AuthHelper.Unauthorized();

        var deleted = await svc.DeleteAsync(id, actorId.Value);
        return deleted ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> GetPhotoUploadUrl(
        Guid id, HttpContext ctx, PersonService svc)
    {
        if (!AuthHelper.CanMutate(ctx)) return AuthHelper.Forbid();
        var result = await svc.GetPhotoUploadUrlAsync(id);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }
}
