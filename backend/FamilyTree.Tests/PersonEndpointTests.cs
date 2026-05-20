using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FamilyTree.Api.Models;
using FamilyTree.Tests.Helpers;
using Xunit;

namespace FamilyTree.Tests;

public class PersonEndpointTests(FamilyTreeTestFactory factory)
    : IClassFixture<FamilyTreeTestFactory>
{
    // Well-known seed IDs
    private static readonly Guid RahulId  = Guid.Parse("20000000-0000-0000-0000-000000000008");
    private static readonly Guid SatheTreeId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid PanseTreeId = Guid.Parse("10000000-0000-0000-0000-000000000002");

    [Fact]
    public async Task GetPerson_ReturnsOk_ForExistingId()
    {
        var client   = factory.AsPowerAdmin();
        var response = await client.GetAsync($"/api/v1/persons/{RahulId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Rahul Sathe", body.GetProperty("fullName").GetString());
    }

    [Fact]
    public async Task GetPerson_ReturnsNotFound_ForUnknownId()
    {
        var client   = factory.AsPowerAdmin();
        var response = await client.GetAsync($"/api/v1/persons/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetPersonDetail_ReturnsOk_WithJobsArray()
    {
        var client   = factory.AsPowerAdmin();
        var response = await client.GetAsync($"/api/v1/persons/{RahulId}/detail");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Rahul Sathe", body.GetProperty("fullName").GetString());
        Assert.True(body.GetProperty("jobs").GetArrayLength() > 0);
    }

    [Fact]
    public async Task GetPersonDetail_ReturnsNotFound_ForMissingPerson()
    {
        var client   = factory.AsPowerAdmin();
        var response = await client.GetAsync($"/api/v1/persons/{Guid.NewGuid()}/detail");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreatePerson_Returns201_ForFamilyAdmin()
    {
        var client  = factory.AsSatheAdmin();
        var payload = new CreatePersonRequest(
            FullName: "Test Person Alpha",
            NameBefore: null,
            Phone: null,
            Location: "Pune",
            BirthMonthYear: "Jan 2000",
            DeathMonthYear: null,
            TreeId: SatheTreeId,
            Role: "member");

        var response = await client.PostAsJsonAsync("/api/v1/persons", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Test Person Alpha", body.GetProperty("fullName").GetString());
    }

    [Fact]
    public async Task CreatePerson_Returns403_ForCommunityMember()
    {
        var client  = factory.AsCommunityMember();
        var payload = new CreatePersonRequest("Blocked", null, null, null, null, null, SatheTreeId);
        var response = await client.PostAsJsonAsync("/api/v1/persons", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CreatePerson_Returns403_WhenFamilyAdminTriesWrongTree()
    {
        // Sathe admin trying to create in the Panse tree
        var client  = factory.AsSatheAdmin();
        var payload = new CreatePersonRequest("New Panse", null, null, null, null, null, PanseTreeId);
        var response = await client.PostAsJsonAsync("/api/v1/persons", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdatePerson_Returns200_ForFamilyAdminInAssignedTree()
    {
        // First create a person in the Sathe tree
        var admin = factory.AsSatheAdmin();
        var created = await admin.PostAsJsonAsync("/api/v1/persons",
            new CreatePersonRequest("Update Target", null, null, null, null, null, SatheTreeId));
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        var newId = createdBody.GetProperty("id").GetString();

        // Now update it
        var update   = new UpdatePersonRequest("Updated Name", null, null, "Mumbai", null, null, null, null, null, null, null, null);
        var response = await admin.PutAsJsonAsync($"/api/v1/persons/{newId}", update);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Updated Name", body.GetProperty("fullName").GetString());
    }

    [Fact]
    public async Task UpdatePerson_Returns403_ForFamilyAdminInWrongTree()
    {
        // Snehal is in Panse tree — Sathe admin should be blocked
        var snehalId = Guid.Parse("20000000-0000-0000-0000-000000000017");
        var client   = factory.AsSatheAdmin();
        var update   = new UpdatePersonRequest("Hacked", null, null, null, null, null, null, null, null, null, null, null);
        var response = await client.PutAsJsonAsync($"/api/v1/persons/{snehalId}", update);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeletePerson_Returns204_ForPowerAdmin()
    {
        // Create a person specifically to delete
        var admin = factory.AsPowerAdmin();
        var created = await admin.PostAsJsonAsync("/api/v1/persons",
            new CreatePersonRequest("Delete Me", null, null, null, null, null, SatheTreeId));
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        var newId = createdBody.GetProperty("id").GetString();

        var deleteResp = await admin.DeleteAsync($"/api/v1/persons/{newId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResp.StatusCode);

        // Confirm it's gone
        var getResp = await admin.GetAsync($"/api/v1/persons/{newId}");
        Assert.Equal(HttpStatusCode.NotFound, getResp.StatusCode);
    }

    [Fact]
    public async Task DeletePerson_Returns403_ForFamilyAdmin()
    {
        var client   = factory.AsSatheAdmin();
        var response = await client.DeleteAsync($"/api/v1/persons/{RahulId}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SearchExisting_Returns200_ForFamilyAdmin()
    {
        var client   = factory.AsSatheAdmin();
        var response = await client.GetAsync("/api/v1/persons/search-existing?q=Rahul");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SearchExisting_Returns403_ForCommunityMember()
    {
        var client   = factory.AsCommunityMember();
        var response = await client.GetAsync("/api/v1/persons/search-existing?q=Rahul");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
