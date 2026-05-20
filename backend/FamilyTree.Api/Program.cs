using FamilyTree.Api.Data;
using FamilyTree.Api.DevTools;
using FamilyTree.Api.Endpoints;
using FamilyTree.Api.Middleware;
using FamilyTree.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// ── Services ───────────────────────────────────────────────────────────────

// Azure SQL via EF Core
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration["AzureSQL:ConnectionString"])
        .EnableSensitiveDataLogging(builder.Environment.IsDevelopment()));

// Cosmos DB Gremlin (singleton — manages its own connection pool)
builder.Services.AddSingleton<GraphDbContext>();

// Application services
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<SearchService>();
builder.Services.AddScoped<SurnameRelationshipService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<GraphTraversalService>();
builder.Services.AddScoped<PersonService>();
builder.Services.AddScoped<TreeService>();

// Azure AD B2C (skipped when USE_MOCK_AUTH=true; middleware handles auth instead)
var useMockAuth = builder.Configuration.GetValue<bool>("USE_MOCK_AUTH")
    || Environment.GetEnvironmentVariable("USE_MOCK_AUTH") == "true";

if (!useMockAuth)
{
    builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration, "AzureAdB2C");
    builder.Services.AddAuthorization();
}

// CORS — restrict to frontend origin in production
builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        else
            policy.WithOrigins(builder.Configuration["AllowedOrigin"] ?? "https://familytree.example.com")
                  .AllowAnyMethod()
                  .AllowAnyHeader();
    }));

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "FamilyTree API", Version = "v1" });
});

var app = builder.Build();

// ── Middleware pipeline ────────────────────────────────────────────────────

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseMockAuthIfDev(builder.Configuration);  // injects ClaimsPrincipal from headers in dev

// ── Database initialisation (dev only) ────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();        // apply EF migrations
    await DataSeeder.SeedAsync(db);          // seed if empty
}

// ── API endpoints ─────────────────────────────────────────────────────────
app.MapPersonEndpoints();
app.MapTreeEndpoints();
app.MapSurnameEndpoints();
app.MapSearchEndpoints();
app.MapAdminEndpoints();

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();

// Expose for integration tests
public partial class Program { }
