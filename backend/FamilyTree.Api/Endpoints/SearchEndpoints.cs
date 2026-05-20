using FamilyTree.Api.Services;

namespace FamilyTree.Api.Endpoints;

public static class SearchEndpoints
{
    public static void MapSearchEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/search", Search).WithTags("Search");
    }

    private static async Task<IResult> Search(
        string? q, string? surname, SearchService svc)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Results.BadRequest(new { error = "Query parameter 'q' is required." });

        var results = await svc.SearchAsync(q, surname);
        return Results.Ok(results);
    }
}
