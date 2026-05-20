using FamilyTree.Api.Data;
using Microsoft.Extensions.Configuration;

namespace FamilyTree.Tests.Helpers;

/// <summary>
/// Stub GraphDbContext that returns empty results for all Gremlin queries.
/// Calls GraphDbContext's protected no-arg constructor to skip the real GremlinClient.
/// </summary>
public class FakeGraphDbContext : GraphDbContext
{
    public FakeGraphDbContext(IConfiguration _) : base() { }

    public override Task<IReadOnlyCollection<IDictionary<string, object>>> QueryAsync(
        string gremlin, Dictionary<string, object>? bindings = null) =>
        Task.FromResult<IReadOnlyCollection<IDictionary<string, object>>>(
            Array.Empty<IDictionary<string, object>>());

    public override Task<T?> ScalarAsync<T>(
        string gremlin, Dictionary<string, object>? bindings = null)
        where T : default =>
        Task.FromResult<T?>(default);
}
