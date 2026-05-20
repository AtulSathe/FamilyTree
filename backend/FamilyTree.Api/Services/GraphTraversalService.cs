using FamilyTree.Api.Data;
using FamilyTree.Api.Models;

namespace FamilyTree.Api.Services;

public class GraphTraversalService(GraphDbContext graph)
{
    // Relationship types that are always undirected (same on both sides)
    private static readonly HashSet<string> BidirectionalEdges =
        ["spouse", "sibling_of", "in_law_of"];

    /// <summary>
    /// Returns all direct neighbours of a person vertex, with edge type and direction.
    /// Direction: "out" = this person IS the source (e.g. parent_of → this is the parent),
    ///            "in"  = this person IS the target (e.g. parent_of → this is the child),
    ///            "both" = undirected relationship.
    /// </summary>
    public async Task<List<RelationDto>> GetNeighboursAsync(
        string personId,
        Func<IEnumerable<string>, Task<Dictionary<string, (string fullName, string? photoUrl)>>> sqlLookup)
    {
        // outgoing edges: this person → other (e.g. parent_of → I am the parent)
        var outEdges = await graph.QueryAsync(
            "g.V().has('person','personId',pid).outE().project('type','otherId')" +
            ".by(label()).by(inV().values('personId'))",
            new Dictionary<string, object> { ["pid"] = personId });

        // incoming edges: other → this person (e.g. parent_of → I am the child)
        var inEdges = await graph.QueryAsync(
            "g.V().has('person','personId',pid).inE().project('type','otherId')" +
            ".by(label()).by(outV().values('personId'))",
            new Dictionary<string, object> { ["pid"] = personId });

        // Collect all unique neighbour IDs
        var allIds = outEdges.Select(e => e["otherId"]?.ToString()!)
            .Concat(inEdges.Select(e => e["otherId"]?.ToString()!))
            .Where(id => id is not null)
            .Distinct()
            .ToList();

        // Bulk-fetch names + photos from SQL via caller-supplied lookup
        var sqlData = await sqlLookup(allIds);

        var relations = new List<RelationDto>();

        foreach (var edge in outEdges)
        {
            var otherId = edge["otherId"]?.ToString();
            var edgeType = edge["type"]?.ToString();
            if (otherId is null || edgeType is null) continue;

            var dir = BidirectionalEdges.Contains(edgeType) ? "both" : "out";
            sqlData.TryGetValue(otherId, out var info);

            if (Guid.TryParse(otherId, out var otherGuid))
                relations.Add(new RelationDto(otherGuid, info.fullName ?? otherId, info.photoUrl, edgeType, dir));
        }

        foreach (var edge in inEdges)
        {
            var otherId = edge["otherId"]?.ToString();
            var edgeType = edge["type"]?.ToString();
            if (otherId is null || edgeType is null) continue;

            // Skip if already captured as bidirectional from outEdges
            if (BidirectionalEdges.Contains(edgeType)
                && relations.Any(r => r.PersonId.ToString() == otherId && r.RelationshipType == edgeType))
                continue;

            sqlData.TryGetValue(otherId, out var info);

            if (Guid.TryParse(otherId, out var otherGuid))
                relations.Add(new RelationDto(otherGuid, info.fullName ?? otherId, info.photoUrl, edgeType, "in"));
        }

        return relations;
    }

    /// <summary>Returns the hop count of the shortest path between two persons, or -1 if no path.</summary>
    public async Task<int> GetShortestPathHopsAsync(string personAId, string personBId)
    {
        var result = await graph.ScalarAsync<long>(
            "g.V().has('person','personId',aid)" +
            ".repeat(both().simplePath()).until(has('person','personId',bid))" +
            ".path().limit(1).count(local)",
            new Dictionary<string, object> { ["aid"] = personAId, ["bid"] = personBId });

        // path count(local) returns number of vertices in path; hops = vertices - 1
        return result > 0 ? (int)(result - 1) : -1;
    }

    /// <summary>Adds a Gremlin vertex for a newly created person.</summary>
    public async Task AddPersonVertexAsync(string personId, string fullName, string? nameBefore, string? primaryTreeId)
    {
        await graph.QueryAsync(
            "g.addV('person')" +
            ".property('personId', pid)" +
            ".property('fullName', fname)" +
            ".property('nameBefore', nbefore)" +
            ".property('primaryTreeId', treeid)",
            new Dictionary<string, object>
            {
                ["pid"]     = personId,
                ["fname"]   = fullName,
                ["nbefore"] = nameBefore ?? string.Empty,
                ["treeid"]  = primaryTreeId ?? string.Empty
            });
    }

    /// <summary>Updates mutable properties on an existing person vertex.</summary>
    public async Task UpdatePersonVertexAsync(string personId, string fullName, string? nameBefore)
    {
        await graph.QueryAsync(
            "g.V().has('person','personId',pid)" +
            ".property('fullName', fname)" +
            ".property('nameBefore', nbefore)",
            new Dictionary<string, object>
            {
                ["pid"]     = personId,
                ["fname"]   = fullName,
                ["nbefore"] = nameBefore ?? string.Empty
            });
    }

    /// <summary>Adds a directed edge between two person vertices.</summary>
    public async Task AddEdgeAsync(string fromPersonId, string toPersonId, string edgeLabel)
    {
        await graph.QueryAsync(
            "g.V().has('person','personId',aid).as('a')" +
            ".V().has('person','personId',bid)" +
            ".addE(elabel).from('a')",
            new Dictionary<string, object>
            {
                ["aid"]    = fromPersonId,
                ["bid"]    = toPersonId,
                ["elabel"] = edgeLabel
            });
    }
}
