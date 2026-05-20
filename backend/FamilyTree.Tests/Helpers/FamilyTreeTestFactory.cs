using FamilyTree.Api.Data;
using FamilyTree.Api.DevTools;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FamilyTree.Tests.Helpers;

/// <summary>
/// Custom WebApplicationFactory:
/// - Replaces SQL Server with EF Core InMemory (unique DB per factory instance)
/// - Replaces GraphDbContext singleton with FakeGraphDbContext (no Gremlin)
/// - Sets USE_MOCK_AUTH=true so X-Mock-* headers drive identity
/// - Uses "Testing" environment to skip Program.cs's MigrateAsync + DataSeeder block
/// - Seeds data manually via DataSeeder after host is created
/// </summary>
public class FamilyTreeTestFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    public FamilyTreeTestFactory()
    {
        // Set env var before Program.cs reads configuration during service registration.
        // Without this, AddMicrosoftIdentityWebApiAuthentication gets registered, and
        // .NET 8 auto-adds UseAuthentication() even when we only call UseMockAuthIfDev.
        Environment.SetEnvironmentVariable("USE_MOCK_AUTH", "true");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, cfg) =>
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["USE_MOCK_AUTH"]               = "true",
                ["CosmosDb:GremlinEndpoint"]    = "localhost-fake",
                ["CosmosDb:EnableSsl"]          = "false",
                ["AzureBlob:ConnectionString"]  = "UseDevelopmentStorage=true",
                ["AzureBlob:ContainerName"]     = "person-photos"
            }));

        builder.ConfigureServices(services =>
        {
            // ── Replace SQL Server DbContext with InMemory ───────────────────
            var sqlDescriptor = services.Single(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            services.Remove(sqlDescriptor);

            services.AddDbContext<AppDbContext>(opts =>
                opts.UseInMemoryDatabase(_dbName));

            // ── Replace Gremlin singleton with no-op stub ────────────────────
            var graphDescriptor = services.Single(
                d => d.ServiceType == typeof(GraphDbContext));
            services.Remove(graphDescriptor);
            services.AddSingleton<GraphDbContext, FakeGraphDbContext>();
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Seed the InMemory DB once after the host is built
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        DataSeeder.SeedAsync(db).GetAwaiter().GetResult();

        return host;
    }

    // ── Helper: create a client with mock role headers ───────────────────────

    public HttpClient CreateClientAs(
        string role,
        string userId = "00000000-0000-0000-0000-000000000001")
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add("X-Mock-User-Role",  role);
        client.DefaultRequestHeaders.Add("X-Mock-User-Id",    userId);
        client.DefaultRequestHeaders.Add("X-Mock-User-Email", $"{role}@test.dev");
        return client;
    }

    public HttpClient AsPowerAdmin()  => CreateClientAs("power_admin",
        "00000000-0000-0000-0000-000000000001");

    // MockAuthMiddleware hardcodes the Sathe tree for any family_admin request
    public HttpClient AsSatheAdmin()  => CreateClientAs("family_admin",
        "00000000-0000-0000-0000-000000000002");

    public HttpClient AsCommunityMember() => CreateClientAs("community_member",
        "00000000-0000-0000-0000-000000000004");
}
