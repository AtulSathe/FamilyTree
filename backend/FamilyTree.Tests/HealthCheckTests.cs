using FamilyTree.Tests.Helpers;
using Xunit;

namespace FamilyTree.Tests;

public class HealthCheckTests(FamilyTreeTestFactory factory)
    : IClassFixture<FamilyTreeTestFactory>
{
    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        var client   = factory.AsPowerAdmin();
        var response = await client.GetAsync("/health");
        Assert.True(response.IsSuccessStatusCode);
    }
}
