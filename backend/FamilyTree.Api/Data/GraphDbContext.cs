using Gremlin.Net.Driver;
using Gremlin.Net.Driver.Remote;
using Gremlin.Net.Process.Traversal;
using Gremlin.Net.Structure.IO.GraphSON;

namespace FamilyTree.Api.Data;

/// <summary>
/// Wraps Gremlin.Net client for Cosmos DB (prod) or TinkerPop (local dev).
/// Register as singleton — GremlinClient manages its own connection pool.
/// </summary>
public class GraphDbContext : IDisposable
{
    private readonly GremlinClient? _client;

    /// <summary>No-op constructor for test subclasses — skips real Gremlin connection.</summary>
    protected GraphDbContext() { }

    public GraphDbContext(IConfiguration config)
    {
        var endpoint = config["CosmosDb:GremlinEndpoint"] ?? "localhost";
        var port     = config.GetValue<int>("CosmosDb:GremlinPort", 8182);
        var username = config["CosmosDb:GremlinUsername"] ?? "/dbs/familytree/colls/relationships";
        var password = config["CosmosDb:GremlinPassword"] ?? string.Empty;
        var enableSsl = config.GetValue<bool>("CosmosDb:EnableSsl", true);

        var server = new GremlinServer(endpoint, port, enableSsl: enableSsl,
            username: username, password: password);

        _client = new GremlinClient(server,
            messageSerializer: new GraphSON2MessageSerializer());
    }

    /// <summary>Submit a raw Gremlin query and return result set.</summary>
    public virtual async Task<IReadOnlyCollection<IDictionary<string, object>>> QueryAsync(string gremlin,
        Dictionary<string, object>? bindings = null)
    {
        return await _client!.SubmitAsync<IDictionary<string, object>>(gremlin, bindings);
    }

    /// <summary>Submit a query and return a single scalar value.</summary>
    public virtual async Task<T?> ScalarAsync<T>(string gremlin,
        Dictionary<string, object>? bindings = null)
    {
        var result = await _client!.SubmitAsync<T>(gremlin, bindings);
        return result.FirstOrDefault();
    }

    public void Dispose() => _client?.Dispose();
}
