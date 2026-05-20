using FamilyTree.Api.Data;
using FamilyTree.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.DevTools;

/// <summary>
/// Seeds Azure SQL (local: SQL Server) with two complete family trees
/// and a cross-tree marriage link for surname relationship detection testing.
/// Only runs when ASPNETCORE_ENVIRONMENT == Development AND the DB is empty.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.FamilyTrees.AnyAsync()) return; // already seeded

        // ── Users ──────────────────────────────────────────────────────────
        var powerAdmin = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Email = "admin@familytree.dev",
            FullName = "Power Admin",
            Role = "power_admin"
        };
        var satheAdmin = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            Email = "sathe.admin@familytree.dev",
            FullName = "Ramesh Sathe",
            Role = "family_admin"
        };
        var panseAdmin = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            Email = "panse.admin@familytree.dev",
            FullName = "Suresh Panse",
            Role = "family_admin"
        };
        var communityMember = new User
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
            Email = "viewer@familytree.dev",
            FullName = "Anita Viewer",
            Role = "community_member"
        };
        db.Users.AddRange(powerAdmin, satheAdmin, panseAdmin, communityMember);

        // ── Family Trees ───────────────────────────────────────────────────
        var satheTree = new FamilyTree
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Surname = "Sathe",
            Description = "Sathe family originating from Pune, Maharashtra",
            CreatedBy = powerAdmin.Id
        };
        var panseTree = new FamilyTree
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
            Surname = "Panse",
            Description = "Panse family originating from Nashik, Maharashtra",
            CreatedBy = powerAdmin.Id
        };
        db.FamilyTrees.AddRange(satheTree, panseTree);

        // ── FamilyTree Admins ──────────────────────────────────────────────
        db.FamilyTreeAdmins.AddRange(
            new FamilyTreeAdmin { FamilyTreeId = satheTree.Id, UserId = satheAdmin.Id },
            new FamilyTreeAdmin { FamilyTreeId = panseTree.Id, UserId = panseAdmin.Id }
        );

        // ── Sathe Family Persons ───────────────────────────────────────────
        // Generation 1 (great-grandparents)
        var vishnupantSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000001"),
            FamilyTreeId = satheTree.Id,
            FullName = "Vishnupant Sathe",
            NameBefore = null,
            Phone = null,
            Location = "Pune, Maharashtra",
            BirthMonthYear = "Jan 1890",
            DeathMonthYear = "Mar 1965",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Vishnupant",
            CreatedBy = satheAdmin.Id
        };
        var lakshmibaiSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000002"),
            FamilyTreeId = satheTree.Id,
            FullName = "Lakshmibai Sathe",
            NameBefore = "Joshi",
            Phone = null,
            Location = "Pune, Maharashtra",
            BirthMonthYear = "Jun 1895",
            DeathMonthYear = "Sep 1970",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmibai",
            CreatedBy = satheAdmin.Id
        };

        // Generation 2 (grandparents)
        var ramchandraSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000003"),
            FamilyTreeId = satheTree.Id,
            FullName = "Ramchandra Sathe",
            NameBefore = null,
            Phone = null,
            Location = "Pune, Maharashtra",
            BirthMonthYear = "Apr 1920",
            DeathMonthYear = "Nov 1998",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Ramchandra",
            CreatedBy = satheAdmin.Id
        };
        var sumitraSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000004"),
            FamilyTreeId = satheTree.Id,
            FullName = "Sumitra Sathe",
            NameBefore = "Kulkarni",
            Phone = null,
            Location = "Pune, Maharashtra",
            BirthMonthYear = "Feb 1925",
            DeathMonthYear = "Jan 2005",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sumitra",
            CreatedBy = satheAdmin.Id
        };

        // Generation 3 (parents)
        var sureshSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000005"),
            FamilyTreeId = satheTree.Id,
            FullName = "Suresh Sathe",
            NameBefore = null,
            Phone = "+91-9876543210",
            Location = "Mumbai, Maharashtra",
            BirthMonthYear = "Aug 1950",
            DeathMonthYear = null,
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=SureshSathe",
            CreatedBy = satheAdmin.Id
        };
        // Cross-tree bridge — Meena was born Panse, married into Sathe
        var meenaSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000006"),
            FamilyTreeId = satheTree.Id,
            FullName = "Meena Sathe",
            NameBefore = "Panse",           // <-- surname link trigger
            Phone = "+91-9876543211",
            Location = "Mumbai, Maharashtra",
            BirthMonthYear = "Mar 1955",
            DeathMonthYear = null,
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=MeenaSathe",
            CreatedBy = satheAdmin.Id
        };
        var anandSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000007"),
            FamilyTreeId = satheTree.Id,
            FullName = "Anand Sathe",
            NameBefore = null,
            Phone = "+91-9000000001",
            Location = "Pune, Maharashtra",
            BirthMonthYear = "Dec 1952",
            DeathMonthYear = null,
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=AnandSathe",
            CreatedBy = satheAdmin.Id
        };

        // Generation 4 (children — most recent)
        var rahulSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000008"),
            FamilyTreeId = satheTree.Id,
            FullName = "Rahul Sathe",
            NameBefore = null,
            Phone = "+91-9123456789",
            Location = "Bengaluru, Karnataka",
            BirthMonthYear = "May 1980",
            DeathMonthYear = null,
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=RahulSathe",
            CreatedBy = satheAdmin.Id
        };
        var priyaSathe = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000009"),
            FamilyTreeId = satheTree.Id,
            FullName = "Priya Sathe",
            NameBefore = null,
            Phone = "+91-9234567890",
            Location = "Mumbai, Maharashtra",
            BirthMonthYear = "Sep 1983",
            DeathMonthYear = null,
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSathe",
            CreatedBy = satheAdmin.Id
        };

        db.Persons.AddRange(
            vishnupantSathe, lakshmibaiSathe,
            ramchandraSathe, sumitraSathe,
            sureshSathe, meenaSathe, anandSathe,
            rahulSathe, priyaSathe
        );

        // ── Panse Family Persons ───────────────────────────────────────────
        var dattatrayaPanse = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000010"),
            FamilyTreeId = panseTree.Id,
            FullName = "Dattatraya Panse",
            NameBefore = null,
            Phone = null,
            Location = "Nashik, Maharashtra",
            BirthMonthYear = "Jul 1900",
            DeathMonthYear = "Feb 1975",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Dattatraya",
            CreatedBy = panseAdmin.Id
        };
        var saraswatiPanse = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000011"),
            FamilyTreeId = panseTree.Id,
            FullName = "Saraswati Panse",
            NameBefore = "Deshpande",
            Phone = null,
            Location = "Nashik, Maharashtra",
            BirthMonthYear = "Oct 1905",
            DeathMonthYear = "Jun 1980",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Saraswati",
            CreatedBy = panseAdmin.Id
        };
        var govindPanse = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000012"),
            FamilyTreeId = panseTree.Id,
            FullName = "Govind Panse",
            NameBefore = null,
            Phone = null,
            Location = "Nashik, Maharashtra",
            BirthMonthYear = "Mar 1930",
            DeathMonthYear = "Apr 2010",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=GovindPanse",
            CreatedBy = panseAdmin.Id
        };
        var shantaPanse = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000013"),
            FamilyTreeId = panseTree.Id,
            FullName = "Shanta Panse",
            NameBefore = "Gokhale",
            Phone = null,
            Location = "Nashik, Maharashtra",
            BirthMonthYear = "Nov 1935",
            DeathMonthYear = null,
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=ShantaPanse",
            CreatedBy = panseAdmin.Id
        };
        // Meena's father — bridges to Sathe tree via Meena's marriage
        var madhavPanse = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000014"),
            FamilyTreeId = panseTree.Id,
            FullName = "Madhav Panse",
            NameBefore = null,
            Phone = "+91-9000000002",
            Location = "Mumbai, Maharashtra",
            BirthMonthYear = "Jan 1928",
            DeathMonthYear = "Dec 2000",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=MadhavPanse",
            CreatedBy = panseAdmin.Id
        };
        var vijayaPanse = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000015"),
            FamilyTreeId = panseTree.Id,
            FullName = "Vijaya Panse",
            NameBefore = "Apte",
            Phone = "+91-9000000003",
            Location = "Mumbai, Maharashtra",
            BirthMonthYear = "Aug 1932",
            DeathMonthYear = "Mar 2015",
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=VijayaPanse",
            CreatedBy = panseAdmin.Id
        };
        var arunPanse = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000016"),
            FamilyTreeId = panseTree.Id,
            FullName = "Arun Panse",
            NameBefore = null,
            Phone = "+91-9876500001",
            Location = "Pune, Maharashtra",
            BirthMonthYear = "Jun 1960",
            DeathMonthYear = null,
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=ArunPanse",
            CreatedBy = panseAdmin.Id
        };
        var snehalPanse = new Person
        {
            Id = Guid.Parse("20000000-0000-0000-0000-000000000017"),
            FamilyTreeId = panseTree.Id,
            FullName = "Snehal Panse",
            NameBefore = null,
            Phone = "+91-9876500002",
            Location = "Hyderabad, Telangana",
            BirthMonthYear = "Feb 1988",
            DeathMonthYear = null,
            PhotoBlobUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=SnehalPanse",
            CreatedBy = panseAdmin.Id
        };

        db.Persons.AddRange(
            dattatrayaPanse, saraswatiPanse,
            govindPanse, shantaPanse,
            madhavPanse, vijayaPanse,
            arunPanse, snehalPanse
        );

        // ── Person Details (for double-click page) ─────────────────────────
        db.PersonDetails.AddRange(
            new PersonDetail
            {
                PersonId = rahulSathe.Id,
                Hobbies = "Cricket, Photography, Trekking in Sahyadri ranges",
                Education = "B.E. Computer Engineering, University of Pune (2002); MBA Finance, IIM Ahmedabad (2004)",
                Skills = "Software Architecture, Project Management, Azure Cloud",
                Jobs = """
                [
                  {"title":"Software Engineer","company":"Infosys","start":"Jun 2002","end":"Dec 2005"},
                  {"title":"Senior Engineer","company":"TCS","start":"Jan 2006","end":"Mar 2010"},
                  {"title":"Tech Lead","company":"Wipro","start":"Apr 2010","end":"present"}
                ]
                """,
                CustomFields = """{"languages":["Marathi","Hindi","English"],"passportNo":"redacted"}"""
            },
            new PersonDetail
            {
                PersonId = priyaSathe.Id,
                Hobbies = "Classical dance (Bharatanatyam), Cooking, Reading Marathi literature",
                Education = "MBBS, B.J. Medical College Pune (2008); MD Paediatrics (2012)",
                Skills = "Paediatrics, Child nutrition, Medical research",
                Jobs = """
                [
                  {"title":"Junior Doctor","company":"KEM Hospital Mumbai","start":"Aug 2008","end":"Jul 2012"},
                  {"title":"Paediatric Consultant","company":"Lilavati Hospital","start":"Aug 2012","end":"present"}
                ]
                """,
                CustomFields = """{"awards":["Best Resident 2011"],"languages":["Marathi","Hindi","English"]}"""
            },
            new PersonDetail
            {
                PersonId = snehalPanse.Id,
                Hobbies = "Chess, Badminton, Startup mentoring",
                Education = "B.Tech Electronics, VJTI Mumbai (2010); MS Computer Science, Georgia Tech (2012)",
                Skills = "Machine Learning, Python, Product Management",
                Jobs = """
                [
                  {"title":"Data Scientist","company":"Amazon","start":"Jul 2012","end":"Dec 2016"},
                  {"title":"Senior Product Manager","company":"Google","start":"Jan 2017","end":"present"}
                ]
                """,
                CustomFields = """{"languages":["Marathi","Hindi","English","Kannada"]}"""
            }
        );

        // ── Pre-computed surname link (Sathe <-> Panse via Meena) ──────────
        // In production this is built by the background job
        db.SurnameLinks.Add(new SurnameLink
        {
            SurnameA = "Sathe",
            SurnameB = "Panse",
            LinkPersonId = meenaSathe.Id,   // Meena born Panse, married Sathe
            RelationshipLevel = 4,           // 4 hops: Sathe root -> Suresh -> Meena -> Madhav -> Panse root
            DetectedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }
}
