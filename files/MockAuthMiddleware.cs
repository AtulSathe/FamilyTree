using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

namespace FamilyTree.Api.Middleware;

/// <summary>
/// In Development, reads X-Mock-User-Role and X-Mock-User-Id headers
/// and injects a ClaimsPrincipal directly — skipping Azure AD B2C entirely.
///
/// Usage: set environment variable USE_MOCK_AUTH=true
/// Add header X-Mock-User-Role: power_admin | family_admin | community_member
/// Add header X-Mock-User-Id: <any guid from DataSeeder.cs>
///
/// Switch between roles mid-session by changing the header in your REST client.
/// </summary>
public class MockAuthMiddleware(RequestDelegate next)
{
    // Default dev user when no headers are provided
    private static readonly string DefaultUserId = "00000000-0000-0000-0000-000000000002";
    private static readonly string DefaultRole = "family_admin";
    private static readonly string DefaultEmail = "sathe.admin@familytree.dev";

    public async Task InvokeAsync(HttpContext context)
    {
        var userId = context.Request.Headers["X-Mock-User-Id"].FirstOrDefault() ?? DefaultUserId;
        var role   = context.Request.Headers["X-Mock-User-Role"].FirstOrDefault() ?? DefaultRole;
        var email  = context.Request.Headers["X-Mock-User-Email"].FirstOrDefault() ?? DefaultEmail;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new("extension_Role", role),
            new(ClaimTypes.Role, role),
        };

        // Add assigned trees claim for FamilyAdmin role
        if (role == "family_admin")
        {
            claims.Add(new Claim("extension_AssignedTrees",
                "10000000-0000-0000-0000-000000000001")); // Sathe tree
        }

        var identity  = new ClaimsIdentity(claims, "MockAuth");
        var principal = new ClaimsPrincipal(identity);

        context.User = principal;
        await next(context);
    }
}

/// <summary>
/// Extension to register mock auth in Program.cs
/// </summary>
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
