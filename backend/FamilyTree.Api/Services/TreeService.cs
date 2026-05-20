using FamilyTree.Api.Data;
using FamilyTree.Api.Domain;
using FamilyTree.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.Services;

public class TreeService(
    AppDbContext db,
    GraphTraversalService graph,
    AuditService audit)
{
    public async Task<List<FamilyTreeResponse>> ListAllAsync()
    {
        return await db.FamilyTrees
            .Select(t => new FamilyTreeResponse(
                t.Id,
                t.Surname,
                t.Description,
                t.PersonMemberships.Count))
            .ToListAsync();
    }

    public async Task<FamilyTreeResponse> CreateAsync(CreateTreeRequest req, Guid actorId)
    {
        var tree = new Domain.FamilyTree
        {
            Surname     = req.Surname,
            Description = req.Description,
            CreatedBy   = actorId,
            CreatedAt   = DateTime.UtcNow
        };

        db.FamilyTrees.Add(tree);
        await db.SaveChangesAsync();

        await audit.LogAsync(actorId, "FamilyTree", tree.Id, "CREATE", null,
            new { tree.Surname, tree.Description });

        return new FamilyTreeResponse(tree.Id, tree.Surname, tree.Description, 0);
    }

    /// <summary>
    /// Returns the focal person node with its direct neighbours from the Gremlin graph.
    /// levels > 1 is handled by calling this endpoint multiple times from the frontend (+/- buttons).
    /// </summary>
    public async Task<TreeNodeResponse?> GetNodeAsync(Guid treeId, Guid personId, int levels = 1)
    {
        // Confirm person is in this tree
        var inTree = await db.PersonTreeMemberships
            .AnyAsync(m => m.FamilyTreeId == treeId && m.PersonId == personId);
        if (!inTree) return null;

        var person = await db.Persons
            .Where(p => p.Id == personId)
            .Select(p => new PersonResponse(
                p.Id, p.FullName, p.NameBefore, p.Phone, p.Location,
                p.BirthMonthYear, p.DeathMonthYear, p.PhotoBlobUrl, p.PrimaryTreeId))
            .FirstOrDefaultAsync();

        if (person is null) return null;

        var relations = await graph.GetNeighboursAsync(
            personId.ToString(),
            async ids =>
            {
                var guids = ids.Select(Guid.Parse).ToList();
                return await db.Persons
                    .Where(p => guids.Contains(p.Id))
                    .ToDictionaryAsync(
                        p => p.Id.ToString(),
                        p => (p.FullName, p.PhotoBlobUrl));
            });

        return new TreeNodeResponse(person, relations);
    }

    public async Task AddRelationshipAsync(Guid treeId, CreateRelationshipRequest req, Guid actorId)
    {
        // Verify both persons belong to this tree
        var memberIds = await db.PersonTreeMemberships
            .Where(m => m.FamilyTreeId == treeId
                     && (m.PersonId == req.PersonAId || m.PersonId == req.PersonBId))
            .Select(m => m.PersonId)
            .ToListAsync();

        if (!memberIds.Contains(req.PersonAId) || !memberIds.Contains(req.PersonBId))
            throw new InvalidOperationException("Both persons must be members of the tree.");

        var aId = req.PersonAId.ToString();
        var bId = req.PersonBId.ToString();

        // Add primary edge (A → B)
        await graph.AddEdgeAsync(aId, bId, req.RelationshipType);

        // Add reverse edge for directed relationships
        var reverseMap = new Dictionary<string, string>
        {
            ["parent_of"]         = "child_of",
            ["child_of"]          = "parent_of",
            ["step_parent_of"]    = "child_of",
            ["adoptive_parent_of"]= "child_of"
        };

        if (reverseMap.TryGetValue(req.RelationshipType, out var reverse))
            await graph.AddEdgeAsync(bId, aId, reverse);
        else
            // Undirected: add B → A with same label
            await graph.AddEdgeAsync(bId, aId, req.RelationshipType);

        await audit.LogAsync(actorId, "Relationship", req.PersonAId, "CREATE", null, new
        {
            req.PersonAId, req.PersonBId, req.RelationshipType, TreeId = treeId
        });
    }

    public async Task AddMemberAsync(Guid treeId, Guid personId, string role, Guid actorId)
    {
        var exists = await db.PersonTreeMemberships
            .AnyAsync(m => m.FamilyTreeId == treeId && m.PersonId == personId);
        if (exists) return;

        db.PersonTreeMemberships.Add(new PersonTreeMembership
        {
            PersonId     = personId,
            FamilyTreeId = treeId,
            Role         = role,
            AddedAt      = DateTime.UtcNow,
            AddedBy      = actorId
        });
        await db.SaveChangesAsync();
    }

    public async Task<bool> RemoveMemberAsync(Guid treeId, Guid personId, Guid actorId)
    {
        var membership = await db.PersonTreeMemberships
            .FindAsync(personId, treeId);
        if (membership is null) return false;

        db.PersonTreeMemberships.Remove(membership);
        await db.SaveChangesAsync();

        await audit.LogAsync(actorId, "Relationship", personId, "DELETE",
            new { TreeId = treeId, membership.Role }, null);
        return true;
    }
}
