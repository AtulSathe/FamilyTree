using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FamilyTree.Api.Data;
using FamilyTree.Api.Models;
using FamilyTree.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FamilyTree.Tests;

public class AuditLogTests(FamilyTreeTestFactory factory)
    : IClassFixture<FamilyTreeTestFactory>
{
    private static readonly Guid SatheTreeId = Guid.Parse("10000000-0000-0000-0000-000000000001");

    // ── Helpers ──────────────────────────────────────────────────────────────

    private int GetAuditCount(string entityType, string action)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return db.AuditLog.Count(a => a.EntityType == entityType && a.Action == action);
    }

    // ── Person audit ─────────────────────────────────────────────────────────

    [Fact]
    public async Task CreatePerson_CreatesAuditLogEntry()
    {
        var before = GetAuditCount("Person", "CREATE");

        var client = factory.AsPowerAdmin();
        await client.PostAsJsonAsync("/api/v1/persons",
            new CreatePersonRequest("Audit Person A", null, null, null, null, null, SatheTreeId));

        var after = GetAuditCount("Person", "CREATE");
        Assert.True(after > before, "Expected at least one Person CREATE audit entry.");
    }

    [Fact]
    public async Task UpdatePerson_CreatesAuditLogEntry()
    {
        var admin   = factory.AsPowerAdmin();
        var created = await admin.PostAsJsonAsync("/api/v1/persons",
            new CreatePersonRequest("Audit Person B", null, null, null, null, null, SatheTreeId));
        var body    = await created.Content.ReadFromJsonAsync<JsonElement>();
        var id      = body.GetProperty("id").GetString();

        var before = GetAuditCount("Person", "UPDATE");

        await admin.PutAsJsonAsync($"/api/v1/persons/{id}",
            new UpdatePersonRequest("Audit Person B Updated", null, null, null, null, null, null, null, null, null, null, null));

        var after = GetAuditCount("Person", "UPDATE");
        Assert.True(after > before, "Expected at least one Person UPDATE audit entry.");
    }

    [Fact]
    public async Task DeletePerson_CreatesAuditLogEntry()
    {
        var admin   = factory.AsPowerAdmin();
        var created = await admin.PostAsJsonAsync("/api/v1/persons",
            new CreatePersonRequest("Audit Person C", null, null, null, null, null, SatheTreeId));
        var body    = await created.Content.ReadFromJsonAsync<JsonElement>();
        var id      = body.GetProperty("id").GetString();

        var before = GetAuditCount("Person", "DELETE");
        await admin.DeleteAsync($"/api/v1/persons/{id}");
        var after  = GetAuditCount("Person", "DELETE");

        Assert.True(after > before, "Expected at least one Person DELETE audit entry.");
    }

    // ── Tree audit ───────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateTree_CreatesAuditLogEntry()
    {
        var before = GetAuditCount("FamilyTree", "CREATE");

        await factory.AsPowerAdmin().PostAsJsonAsync("/api/v1/trees",
            new CreateTreeRequest("AuditTree", null));

        var after = GetAuditCount("FamilyTree", "CREATE");
        Assert.True(after > before, "Expected at least one FamilyTree CREATE audit entry.");
    }

    // ── Admin audit-log endpoint ─────────────────────────────────────────────

    [Fact]
    public async Task AuditLogEndpoint_RequiresPowerAdmin()
    {
        var response = await factory.AsCommunityMember().GetAsync("/api/v1/admin/audit-log");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AuditLogEndpoint_Returns403_ForFamilyAdmin()
    {
        var response = await factory.AsSatheAdmin().GetAsync("/api/v1/admin/audit-log");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AuditLogEndpoint_ReturnsPaginatedEnvelope()
    {
        var response = await factory.AsPowerAdmin()
            .GetAsync("/api/v1/admin/audit-log?page=1&pageSize=5");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("total",    out _));
        Assert.True(body.TryGetProperty("page",     out _));
        Assert.True(body.TryGetProperty("pageSize", out _));
        Assert.True(body.TryGetProperty("items",    out var items));
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
    }

    [Fact]
    public async Task AuditLogEndpoint_PageSizeClamped()
    {
        // Request pageSize=9999 — should be clamped to 200
        var response = await factory.AsPowerAdmin()
            .GetAsync("/api/v1/admin/audit-log?page=1&pageSize=9999");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body     = await response.Content.ReadFromJsonAsync<JsonElement>();
        var pageSize = body.GetProperty("pageSize").GetInt32();
        Assert.True(pageSize <= 200);
    }
}
