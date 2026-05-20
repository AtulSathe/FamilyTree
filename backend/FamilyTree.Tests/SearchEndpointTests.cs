using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FamilyTree.Tests.Helpers;
using Xunit;

namespace FamilyTree.Tests;

public class SearchEndpointTests(FamilyTreeTestFactory factory)
    : IClassFixture<FamilyTreeTestFactory>
{
    [Fact]
    public async Task Search_ReturnsOk_ForAllRoles()
    {
        var response = await factory.AsCommunityMember().GetAsync("/api/v1/search?q=Rahul");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Search_ByName_ReturnsMatchingPerson()
    {
        var response = await factory.AsPowerAdmin().GetAsync("/api/v1/search?q=Rahul");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var results = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(results.GetArrayLength() >= 1);

        var first = results.EnumerateArray().First();
        Assert.Contains("Rahul", first.GetProperty("fullName").GetString());
    }

    [Fact]
    public async Task Search_WithSurnameFilter_ReturnsOnlyThatSurname()
    {
        var response = await factory.AsPowerAdmin()
            .GetAsync("/api/v1/search?q=Sathe&surname=Sathe");
        var results  = await response.Content.ReadFromJsonAsync<JsonElement>();

        // Every result should be in the Sathe tree
        foreach (var item in results.EnumerateArray())
            Assert.Equal("Sathe", item.GetProperty("surname").GetString());
    }

    [Fact]
    public async Task Search_WithMissingQ_Returns400()
    {
        var response = await factory.AsPowerAdmin().GetAsync("/api/v1/search");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_WithEmptyQ_Returns400()
    {
        var response = await factory.AsPowerAdmin().GetAsync("/api/v1/search?q=");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_WithNoMatches_ReturnsEmptyArray()
    {
        var response = await factory.AsPowerAdmin()
            .GetAsync("/api/v1/search?q=ZZZNOMATCHZZZ");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var results = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, results.GetArrayLength());
    }

    [Fact]
    public async Task Search_CrossTreePerson_ReturnsOneResultPerTree()
    {
        // Meena appears in both Sathe and Panse trees — should get 2 results
        var response = await factory.AsPowerAdmin().GetAsync("/api/v1/search?q=Meena");
        var results  = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(results.GetArrayLength() >= 2);
    }

    [Fact]
    public async Task Search_SurnamesCovered_InResults()
    {
        var response = await factory.AsPowerAdmin().GetAsync("/api/v1/search?q=Panse");
        var results  = await response.Content.ReadFromJsonAsync<JsonElement>();

        // Results should include persons from the Panse tree
        Assert.True(results.GetArrayLength() > 0);
        var surnames = results.EnumerateArray()
            .Select(r => r.GetProperty("surname").GetString())
            .Distinct()
            .ToList();
        Assert.Contains("Panse", surnames);
    }
}
