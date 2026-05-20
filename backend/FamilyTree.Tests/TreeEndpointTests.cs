using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FamilyTree.Api.Models;
using FamilyTree.Tests.Helpers;
using Xunit;

namespace FamilyTree.Tests;

public class TreeEndpointTests(FamilyTreeTestFactory factory)
    : IClassFixture<FamilyTreeTestFactory>
{
    private static readonly Guid SatheTreeId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid PanseTreeId  = Guid.Parse("10000000-0000-0000-0000-000000000002");
    private static readonly Guid SureshId     = Guid.Parse("20000000-0000-0000-0000-000000000005");
    private static readonly Guid RahulId      = Guid.Parse("20000000-0000-0000-0000-000000000008");

    [Fact]
    public async Task ListTrees_ReturnsOk_WithTwoSeededTrees()
    {
        var client   = factory.AsPowerAdmin();
        var response = await client.GetAsync("/api/v1/trees");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var trees = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(trees.GetArrayLength() >= 2);

        var surnames = trees.EnumerateArray()
            .Select(t => t.GetProperty("surname").GetString())
            .ToList();
        Assert.Contains("Sathe", surnames);
        Assert.Contains("Panse", surnames);
    }

    [Fact]
    public async Task ListTrees_ReturnsOk_ForCommunityMember()
    {
        var client   = factory.AsCommunityMember();
        var response = await client.GetAsync("/api/v1/trees");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreateTree_Returns201_ForPowerAdmin()
    {
        var client   = factory.AsPowerAdmin();
        var payload  = new CreateTreeRequest("TestSurname", "A test family");
        var response = await client.PostAsJsonAsync("/api/v1/trees", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("TestSurname", body.GetProperty("surname").GetString());
        Assert.Equal(0, body.GetProperty("memberCount").GetInt32());
    }

    [Fact]
    public async Task CreateTree_Returns403_ForFamilyAdmin()
    {
        var client   = factory.AsSatheAdmin();
        var payload  = new CreateTreeRequest("FamilyAdminTree", null);
        var response = await client.PostAsJsonAsync("/api/v1/trees", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreateTree_Returns403_ForCommunityMember()
    {
        var client   = factory.AsCommunityMember();
        var payload  = new CreateTreeRequest("CommunityTree", null);
        var response = await client.PostAsJsonAsync("/api/v1/trees", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetNode_ReturnsOk_WhenPersonIsInTree()
    {
        // Suresh is in the Sathe tree per seed data
        var client   = factory.AsPowerAdmin();
        var response = await client.GetAsync(
            $"/api/v1/trees/{SatheTreeId}/node/{SureshId}?levels=1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Suresh Sathe", body.GetProperty("person")
            .GetProperty("fullName").GetString());
        // relations is an array (may be empty since FakeGraphDbContext returns no edges)
        Assert.True(body.TryGetProperty("relations", out var rels));
        Assert.Equal(JsonValueKind.Array, rels.ValueKind);
    }

    [Fact]
    public async Task GetNode_ReturnsNotFound_WhenPersonNotInTree()
    {
        // Snehal is in Panse, not in Sathe tree
        var snehalId = Guid.Parse("20000000-0000-0000-0000-000000000017");
        var client   = factory.AsPowerAdmin();
        var response = await client.GetAsync(
            $"/api/v1/trees/{SatheTreeId}/node/{snehalId}?levels=1");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetNode_ReturnsOk_ForCommunityMember()
    {
        var client   = factory.AsCommunityMember();
        var response = await client.GetAsync(
            $"/api/v1/trees/{SatheTreeId}/node/{RahulId}?levels=1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AddRelationship_Returns400_WhenPersonNotInTree()
    {
        // Snehal (Panse) cannot be related to Rahul (Sathe) via Sathe tree
        var snehalId = Guid.Parse("20000000-0000-0000-0000-000000000017");
        var client   = factory.AsPowerAdmin();
        var payload  = new CreateRelationshipRequest(RahulId, snehalId, "sibling_of");
        var response = await client.PostAsJsonAsync(
            $"/api/v1/trees/{SatheTreeId}/relationships", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddRelationship_Returns403_WhenFamilyAdminTriesWrongTree()
    {
        var arunId  = Guid.Parse("20000000-0000-0000-0000-000000000016");
        var snehalId = Guid.Parse("20000000-0000-0000-0000-000000000017");
        var client  = factory.AsSatheAdmin();  // Sathe admin, not Panse
        var payload = new CreateRelationshipRequest(arunId, snehalId, "parent_of");
        var response = await client.PostAsJsonAsync(
            $"/api/v1/trees/{PanseTreeId}/relationships", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AddMember_ReturnsNoContent_ForPowerAdmin()
    {
        // Create a new person first, then link them into Sathe tree
        var admin   = factory.AsPowerAdmin();
        var created = await admin.PostAsJsonAsync("/api/v1/persons",
            new CreatePersonRequest("New Member", null, null, null, null, null, SatheTreeId));
        var body    = await created.Content.ReadFromJsonAsync<JsonElement>();
        var newId   = body.GetProperty("id").GetString();

        // Link to Panse tree as well
        var response = await admin.PostAsync(
            $"/api/v1/trees/{PanseTreeId}/members/{newId}?role=admin_linked", null);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task RemoveMember_Returns403_ForFamilyAdmin()
    {
        var client   = factory.AsSatheAdmin();
        var response = await client.DeleteAsync(
            $"/api/v1/trees/{SatheTreeId}/members/{RahulId}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
