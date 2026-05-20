using System.Net;
using System.Net.Http.Json;
using FamilyTree.Api.Models;
using FamilyTree.Tests.Helpers;
using Xunit;

namespace FamilyTree.Tests;

/// <summary>
/// Cross-cutting authorization matrix: verifies each role can do what it should
/// and is blocked from what it should not be able to do.
/// </summary>
public class AuthorizationTests(FamilyTreeTestFactory factory)
    : IClassFixture<FamilyTreeTestFactory>
{
    private static readonly Guid SatheTreeId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid RahulId     = Guid.Parse("20000000-0000-0000-0000-000000000008");

    // ── CommunityMember ──────────────────────────────────────────────────────

    [Fact]
    public async Task CommunityMember_CanReadPerson()
    {
        var response = await factory.AsCommunityMember()
            .GetAsync($"/api/v1/persons/{RahulId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CommunityMember_CanReadPersonDetail()
    {
        var response = await factory.AsCommunityMember()
            .GetAsync($"/api/v1/persons/{RahulId}/detail");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CommunityMember_CanListTrees()
    {
        var response = await factory.AsCommunityMember().GetAsync("/api/v1/trees");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CommunityMember_CannotCreatePerson()
    {
        var payload  = new CreatePersonRequest("Blocked", null, null, null, null, null, SatheTreeId);
        var response = await factory.AsCommunityMember()
            .PostAsJsonAsync("/api/v1/persons", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CommunityMember_CannotDeletePerson()
    {
        var response = await factory.AsCommunityMember()
            .DeleteAsync($"/api/v1/persons/{RahulId}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CommunityMember_CannotAccessAdminUsers()
    {
        var response = await factory.AsCommunityMember().GetAsync("/api/v1/admin/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CommunityMember_CannotCreateTree()
    {
        var payload  = new CreateTreeRequest("Blocked", null);
        var response = await factory.AsCommunityMember()
            .PostAsJsonAsync("/api/v1/trees", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── FamilyAdmin ──────────────────────────────────────────────────────────

    [Fact]
    public async Task FamilyAdmin_CanCreatePersonInAssignedTree()
    {
        var payload  = new CreatePersonRequest("FA Person", null, null, null, null, null, SatheTreeId);
        var response = await factory.AsSatheAdmin()
            .PostAsJsonAsync("/api/v1/persons", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task FamilyAdmin_CannotCreateNewTree()
    {
        var payload  = new CreateTreeRequest("FATree", null);
        var response = await factory.AsSatheAdmin()
            .PostAsJsonAsync("/api/v1/trees", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task FamilyAdmin_CannotDeletePerson()
    {
        var response = await factory.AsSatheAdmin()
            .DeleteAsync($"/api/v1/persons/{RahulId}");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task FamilyAdmin_CannotAccessAdminEndpoints()
    {
        var response = await factory.AsSatheAdmin().GetAsync("/api/v1/admin/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task FamilyAdmin_CannotViewAuditLog()
    {
        var response = await factory.AsSatheAdmin().GetAsync("/api/v1/admin/audit-log");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── PowerAdmin ───────────────────────────────────────────────────────────

    [Fact]
    public async Task PowerAdmin_CanDeletePerson()
    {
        var admin   = factory.AsPowerAdmin();
        var created = await admin.PostAsJsonAsync("/api/v1/persons",
            new CreatePersonRequest("Delete Target", null, null, null, null, null, SatheTreeId));
        var body    = await created.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var id      = body.GetProperty("id").GetString();

        var response = await admin.DeleteAsync($"/api/v1/persons/{id}");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task PowerAdmin_CanCreateTree()
    {
        var payload  = new CreateTreeRequest("PowerTree", null);
        var response = await factory.AsPowerAdmin()
            .PostAsJsonAsync("/api/v1/trees", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task PowerAdmin_CanAccessAdminUsers()
    {
        var response = await factory.AsPowerAdmin().GetAsync("/api/v1/admin/users");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PowerAdmin_CanViewAuditLog()
    {
        var response = await factory.AsPowerAdmin().GetAsync("/api/v1/admin/audit-log");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
