using FamilyTree.Api.Data;
using FamilyTree.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.Services;

public class SearchService(AppDbContext db)
{
    public async Task<List<SearchResultDto>> SearchAsync(string q, string? surname)
    {
        var query = db.PersonTreeMemberships
            .Include(m => m.Person)
            .Include(m => m.FamilyTree)
            .Where(m => EF.Functions.Like(m.Person.FullName, $"%{q}%"));

        if (!string.IsNullOrWhiteSpace(surname))
            query = query.Where(m => m.FamilyTree.Surname == surname);

        return await query
            .Select(m => new SearchResultDto(
                m.PersonId,
                m.Person.FullName,
                m.Person.Location,
                m.Person.BirthMonthYear,
                m.Person.PhotoBlobUrl,
                m.FamilyTreeId,
                m.FamilyTree.Surname))
            .ToListAsync();
    }
}
