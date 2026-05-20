using System.Text.Json;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using FamilyTree.Api.Data;
using FamilyTree.Api.Domain;
using FamilyTree.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.Services;

public class PersonService(
    AppDbContext db,
    GraphTraversalService graph,
    AuditService audit,
    IConfiguration config)
{
    public async Task<PersonResponse?> GetByIdAsync(Guid id)
    {
        return await db.Persons
            .Where(p => p.Id == id)
            .Select(p => new PersonResponse(
                p.Id, p.FullName, p.NameBefore, p.Phone, p.Location,
                p.BirthMonthYear, p.DeathMonthYear, p.PhotoBlobUrl, p.PrimaryTreeId))
            .FirstOrDefaultAsync();
    }

    public async Task<PersonDetailResponse?> GetDetailAsync(Guid id)
    {
        var p = await db.Persons
            .Include(p => p.Detail)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p is null) return null;

        var jobs = p.Detail?.Jobs is null
            ? []
            : JsonSerializer.Deserialize<List<JobDto>>(p.Detail.Jobs,
                  new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        Dictionary<string, object?>? customFields = null;
        if (p.Detail?.CustomFields is not null)
            customFields = JsonSerializer.Deserialize<Dictionary<string, object?>>(
                p.Detail.CustomFields,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return new PersonDetailResponse(
            p.Id, p.FullName, p.NameBefore, p.Phone, p.Location,
            p.BirthMonthYear, p.DeathMonthYear, p.PhotoBlobUrl, p.PrimaryTreeId,
            p.Detail?.Hobbies, p.Detail?.Education, p.Detail?.Skills,
            jobs, customFields);
    }

    public async Task<PersonResponse> CreateAsync(CreatePersonRequest req, Guid actorId)
    {
        var person = new Person
        {
            FullName       = req.FullName,
            NameBefore     = req.NameBefore,
            Phone          = req.Phone,
            Location       = req.Location,
            BirthMonthYear = req.BirthMonthYear,
            DeathMonthYear = req.DeathMonthYear,
            PrimaryTreeId  = req.TreeId,
            CreatedBy      = actorId,
            CreatedAt      = DateTime.UtcNow
        };

        db.Persons.Add(person);

        db.PersonTreeMemberships.Add(new PersonTreeMembership
        {
            PersonId     = person.Id,
            FamilyTreeId = req.TreeId,
            Role         = req.Role,
            AddedAt      = DateTime.UtcNow,
            AddedBy      = actorId
        });

        await db.SaveChangesAsync();

        // Mirror to Cosmos graph
        await graph.AddPersonVertexAsync(
            person.Id.ToString(), person.FullName,
            person.NameBefore, req.TreeId.ToString());

        await audit.LogAsync(actorId, "Person", person.Id, "CREATE", null, new
        {
            person.FullName, person.Location, TreeId = req.TreeId
        });

        return new PersonResponse(
            person.Id, person.FullName, person.NameBefore, person.Phone, person.Location,
            person.BirthMonthYear, person.DeathMonthYear, person.PhotoBlobUrl, person.PrimaryTreeId);
    }

    public async Task<PersonResponse?> UpdateAsync(Guid id, UpdatePersonRequest req, Guid actorId)
    {
        var person = await db.Persons
            .Include(p => p.Detail)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (person is null) return null;

        var snapshot = new
        {
            person.FullName, person.NameBefore, person.Phone, person.Location,
            person.BirthMonthYear, person.DeathMonthYear, person.PhotoBlobUrl
        };

        // Apply scalar updates only when the request provides a non-null value
        if (req.FullName       is not null) person.FullName       = req.FullName;
        if (req.NameBefore     is not null) person.NameBefore     = req.NameBefore;
        if (req.Phone          is not null) person.Phone          = req.Phone;
        if (req.Location       is not null) person.Location       = req.Location;
        if (req.BirthMonthYear is not null) person.BirthMonthYear = req.BirthMonthYear;
        if (req.DeathMonthYear is not null) person.DeathMonthYear = req.DeathMonthYear;
        if (req.PhotoBlobUrl   is not null) person.PhotoBlobUrl   = req.PhotoBlobUrl;
        person.UpdatedAt = DateTime.UtcNow;

        // Upsert PersonDetail if any detail fields are present
        if (req.Hobbies is not null || req.Education is not null || req.Skills is not null
            || req.Jobs is not null || req.CustomFields is not null)
        {
            person.Detail ??= new PersonDetail { PersonId = id };

            if (req.Hobbies    is not null) person.Detail.Hobbies   = req.Hobbies;
            if (req.Education  is not null) person.Detail.Education  = req.Education;
            if (req.Skills     is not null) person.Detail.Skills     = req.Skills;
            if (req.Jobs       is not null) person.Detail.Jobs       = JsonSerializer.Serialize(req.Jobs);
            if (req.CustomFields is not null)
                person.Detail.CustomFields = JsonSerializer.Serialize(req.CustomFields);
        }

        await db.SaveChangesAsync();

        // Mirror name changes to Cosmos vertex
        await graph.UpdatePersonVertexAsync(person.Id.ToString(), person.FullName, person.NameBefore);

        await audit.LogAsync(actorId, "Person", id, "UPDATE", snapshot, new
        {
            person.FullName, person.NameBefore, person.Phone, person.Location,
            person.BirthMonthYear, person.DeathMonthYear, person.PhotoBlobUrl
        });

        return new PersonResponse(
            person.Id, person.FullName, person.NameBefore, person.Phone, person.Location,
            person.BirthMonthYear, person.DeathMonthYear, person.PhotoBlobUrl, person.PrimaryTreeId);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actorId)
    {
        var person = await db.Persons
            .Include(p => p.TreeMemberships)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (person is null) return false;

        var snapshot = new { person.FullName, person.Location };

        // Remove all tree memberships first (Restrict FK on FamilyTree side)
        db.PersonTreeMemberships.RemoveRange(person.TreeMemberships);
        db.Persons.Remove(person);
        await db.SaveChangesAsync();

        await audit.LogAsync(actorId, "Person", id, "DELETE", snapshot, null);
        return true;
    }

    public async Task<PhotoUploadUrlResponse?> GetPhotoUploadUrlAsync(Guid id)
    {
        var exists = await db.Persons.AnyAsync(p => p.Id == id);
        if (!exists) return null;

        var connStr       = config["AzureBlob:ConnectionString"] ?? string.Empty;
        var containerName = config["AzureBlob:ContainerName"]    ?? "person-photos";
        var blobName      = $"{id}/{Guid.NewGuid()}.jpg";

        var serviceClient   = new BlobServiceClient(connStr);
        var containerClient = serviceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync();

        var blobClient = containerClient.GetBlobClient(blobName);
        var sasUri = blobClient.GenerateSasUri(
            BlobSasPermissions.Write | BlobSasPermissions.Create,
            DateTimeOffset.UtcNow.AddMinutes(15));

        return new PhotoUploadUrlResponse(sasUri.ToString(), blobName);
    }
}
