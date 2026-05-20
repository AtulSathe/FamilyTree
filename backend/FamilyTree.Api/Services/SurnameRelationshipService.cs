using FamilyTree.Api.Data;
using FamilyTree.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.Services;

public class SurnameRelationshipService(AppDbContext db)
{
    public async Task<List<SurnameResponse>> ListAllSurnamesAsync()
    {
        return await db.FamilyTrees
            .Select(t => new SurnameResponse(
                t.Surname,
                t.Id,
                t.PersonMemberships.Count))
            .ToListAsync();
    }

    public async Task<List<SurnameLinkResponse>> ListCrossLinksAsync()
    {
        return await db.SurnameLinks
            .Include(s => s.LinkPerson)
            .Select(s => new SurnameLinkResponse(
                s.SurnameA,
                s.SurnameB,
                s.LinkPersonId,
                s.LinkPerson.FullName,
                s.RelationshipLevel))
            .ToListAsync();
    }

    public async Task<PersonResponse?> GetRecentLivingMemberAsync(string surname)
    {
        return await db.PersonTreeMemberships
            .Where(m => m.FamilyTree.Surname == surname && m.Person.DeathMonthYear == null)
            .OrderByDescending(m => m.Person.BirthMonthYear)
            .Select(m => new PersonResponse(
                m.Person.Id,
                m.Person.FullName,
                m.Person.NameBefore,
                m.Person.Phone,
                m.Person.Location,
                m.Person.BirthMonthYear,
                m.Person.DeathMonthYear,
                m.Person.PhotoBlobUrl,
                m.Person.PrimaryTreeId))
            .FirstOrDefaultAsync();
    }
}
