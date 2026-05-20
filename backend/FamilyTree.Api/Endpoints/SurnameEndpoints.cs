using FamilyTree.Api.Services;

namespace FamilyTree.Api.Endpoints;

public static class SurnameEndpoints
{
    public static void MapSurnameEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/surnames").WithTags("Surnames");

        // /relationships and /{surname}/recent must be registered before /{surname}
        // to avoid ambiguity if a surname were literally "relationships"
        group.MapGet("/relationships",      ListCrossLinks);
        group.MapGet("/{surname}/recent",   GetRecentMember);
        group.MapGet("/",                   ListSurnames);
    }

    private static async Task<IResult> ListSurnames(SurnameRelationshipService svc) =>
        Results.Ok(await svc.ListAllSurnamesAsync());

    private static async Task<IResult> ListCrossLinks(SurnameRelationshipService svc) =>
        Results.Ok(await svc.ListCrossLinksAsync());

    private static async Task<IResult> GetRecentMember(
        string surname, SurnameRelationshipService svc)
    {
        var result = await svc.GetRecentLivingMemberAsync(surname);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }
}
