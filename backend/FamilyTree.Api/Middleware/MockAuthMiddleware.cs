using System.Security.Claims;

namespace FamilyTree.Api.Middleware;

/// <summary>
/// Development only: reads X-Mock-* headers and injects a ClaimsPrincipal,
/// bypassing Azure AD B2C entirely.
///
/// Activate via appsettings.Development.json: "USE_MOCK_AUTH": true
/// Headers:
///   X-Mock-User-Role  — power_admin | family_admin | community_member
///   X-Mock-User-Id    — any GUID from DataSeeder.cs
///   X-Mock-User-Email — any string
/// </summary>
public class MockAuthMiddleware(RequestDelegate next)
{
    private const string DefaultUserId = "00000000-0000-0000-0000-000000000002";
    private const string DefaultRole   = "family_admin";
    private const string DefaultEmail  = "sathe.admin@familytree.dev";

    public async Task InvokeAsync(HttpContext context)
    {
        var userId = context.Request.Headers["X-Mock-User-Id"].FirstOrDefault()   ?? DefaultUserId;
        var role   = context.Request.Headers["X-Mock-User-Role"].FirstOrDefault() ?? DefaultRole;
        var email  = context.Request.Headers["X-Mock-User-Email"].FirstOrDefault() ?? DefaultEmail;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new("extension_Role", role),
            new(ClaimTypes.Role, role),
        };

        if (role == "family_admin")
        {
            // Default dev family admin is assigned to the Sathe tree
            claims.Add(new Claim("extension_AssignedTrees",
                "10000000-0000-0000-0000-000000000001"));
        }

        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "MockAuth"));
        await next(context);
    }
}

public static class MockAuthExtensions
{
    public static IApplicationBuilder UseMockAuthIfDev(this IApplicationBuilder app, IConfiguration config)
    {
        var useMock = config.GetValue<bool>("USE_MOCK_AUTH")
            || Environment.GetEnvironmentVariable("USE_MOCK_AUTH") == "true";

        if (useMock)
        {
            Console.WriteLine("[DEV] MockAuthMiddleware active — Azure AD B2C bypassed");
            app.UseMiddleware<MockAuthMiddleware>();
        }
        else
        {
            app.UseAuthentication();
            app.UseAuthorization();
        }
        return app;
    }
}
