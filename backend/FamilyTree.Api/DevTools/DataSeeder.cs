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
            Id       = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Email    = "admin@familytree.dev",
            FullName = "Power Admin",
            Role     = "power_admin"
        };
        var satheAdmin = new User
        {
            Id       = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            Email    = "sathe.admin@familytree.dev",
            FullName = "Ramesh Sathe",
            Role     = "family_admin"
        };
        var panseAdmin = new User
        {
            Id       = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            Email    = "panse.admin@familytree.dev",
            FullName = "Suresh Panse",
            Role     = "family_admin"
        };
        var communityMember = new User
        {
            Id       = Guid.Parse("00000000-0000-0000-0000-000000000004"),
            Email    = "viewer@familytree.dev",
            FullName = "Anita Viewer",
            Role     = "community_member"
        };
        db.Users.AddRange(powerAdmin, satheAdmin, panseAdmin, communityMember);

        // ── Family Trees ───────────────────────────────────────────────────
        var satheTree = new Domain.FamilyTree
        {
            Id          = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Surname     = "Sathe",
            Description = "Sathe family originating from Pune, Maharashtra",
            CreatedBy   = powerAdmin.Id
        };
        var panseTree = new Domain.FamilyTree
        {
            Id          = Guid.Parse("10000000-0000-0000-0000-000000000002"),
            Surname     = "Panse",
            Description = "Panse family originating from Nashik, Maharashtra",
            CreatedBy   = powerAdmin.Id
        };
        db.FamilyTrees.AddRange(satheTree, panseTree);

        // ── FamilyTree Admins ──────────────────────────────────────────────
        db.FamilyTreeAdmins.AddRange(
            new FamilyTreeAdmin { FamilyTreeId = satheTree.Id, UserId = satheAdmin.Id },
            new FamilyTreeAdmin { FamilyTreeId = panseTree.Id, UserId = panseAdmin.Id }
        );

        // ── Sathe Family Persons ───────────────────────────────────────────
        var vishnupant = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000001"),
            PrimaryTreeId  = satheTree.Id,
            FullName       = "Vishnupant Sathe",
            Location       = "Pune, Maharashtra",
            BirthMonthYear = "Jan 1890",
            DeathMonthYear = "Mar 1965",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=Vishnupant",
            CreatedBy      = satheAdmin.Id
        };
        var lakshmibai = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000002"),
            PrimaryTreeId  = satheTree.Id,
            FullName       = "Lakshmibai Sathe",
            NameBefore     = "Joshi",
            Location       = "Pune, Maharashtra",
            BirthMonthYear = "Jun 1895",
            DeathMonthYear = "Sep 1970",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=Lakshmibai",
            CreatedBy      = satheAdmin.Id
        };
        var ramchandra = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000003"),
            PrimaryTreeId  = satheTree.Id,
            FullName       = "Ramchandra Sathe",
            Location       = "Pune, Maharashtra",
            BirthMonthYear = "Apr 1920",
            DeathMonthYear = "Nov 1998",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=Ramchandra",
            CreatedBy      = satheAdmin.Id
        };
        var sumitra = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000004"),
            PrimaryTreeId  = satheTree.Id,
            FullName       = "Sumitra Sathe",
            NameBefore     = "Kulkarni",
            Location       = "Pune, Maharashtra",
            BirthMonthYear = "Feb 1925",
            DeathMonthYear = "Jan 2005",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sumitra",
            CreatedBy      = satheAdmin.Id
        };
        var suresh = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000005"),
            PrimaryTreeId  = satheTree.Id,
            FullName       = "Suresh Sathe",
            Phone          = "+91-9876543210",
            Location       = "Mumbai, Maharashtra",
            BirthMonthYear = "Aug 1950",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=SureshSathe",
            CreatedBy      = satheAdmin.Id
        };
        // Cross-tree bridge — born Panse, married into Sathe
        var meena = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000006"),
            PrimaryTreeId  = satheTree.Id,   // first tree she was added to
            FullName       = "Meena Sathe",
            NameBefore     = "Panse",        // maiden surname → triggers cross-link detection
            Phone          = "+91-9876543211",
            Location       = "Mumbai, Maharashtra",
            BirthMonthYear = "Mar 1955",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=MeenaSathe",
            CreatedBy      = satheAdmin.Id
        };
        var anand = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000007"),
            PrimaryTreeId  = satheTree.Id,
            FullName       = "Anand Sathe",
            Phone          = "+91-9000000001",
            Location       = "Pune, Maharashtra",
            BirthMonthYear = "Dec 1952",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=AnandSathe",
            CreatedBy      = satheAdmin.Id
        };
        var rahul = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000008"),
            PrimaryTreeId  = satheTree.Id,
            FullName       = "Rahul Sathe",
            Phone          = "+91-9123456789",
            Location       = "Bengaluru, Karnataka",
            BirthMonthYear = "May 1980",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=RahulSathe",
            CreatedBy      = satheAdmin.Id
        };
        var priya = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000009"),
            PrimaryTreeId  = satheTree.Id,
            FullName       = "Priya Sathe",
            Phone          = "+91-9234567890",
            Location       = "Mumbai, Maharashtra",
            BirthMonthYear = "Sep 1983",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSathe",
            CreatedBy      = satheAdmin.Id
        };

        // ── Panse Family Persons ───────────────────────────────────────────
        var dattatraya = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000010"),
            PrimaryTreeId  = panseTree.Id,
            FullName       = "Dattatraya Panse",
            Location       = "Nashik, Maharashtra",
            BirthMonthYear = "Jul 1900",
            DeathMonthYear = "Feb 1975",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=Dattatraya",
            CreatedBy      = panseAdmin.Id
        };
        var saraswati = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000011"),
            PrimaryTreeId  = panseTree.Id,
            FullName       = "Saraswati Panse",
            NameBefore     = "Deshpande",
            Location       = "Nashik, Maharashtra",
            BirthMonthYear = "Oct 1905",
            DeathMonthYear = "Jun 1980",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=Saraswati",
            CreatedBy      = panseAdmin.Id
        };
        var govind = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000012"),
            PrimaryTreeId  = panseTree.Id,
            FullName       = "Govind Panse",
            Location       = "Nashik, Maharashtra",
            BirthMonthYear = "Mar 1930",
            DeathMonthYear = "Apr 2010",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=GovindPanse",
            CreatedBy      = panseAdmin.Id
        };
        var shanta = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000013"),
            PrimaryTreeId  = panseTree.Id,
            FullName       = "Shanta Panse",
            NameBefore     = "Gokhale",
            Location       = "Nashik, Maharashtra",
            BirthMonthYear = "Nov 1935",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=ShantaPanse",
            CreatedBy      = panseAdmin.Id
        };
        var madhav = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000014"),
            PrimaryTreeId  = panseTree.Id,
            FullName       = "Madhav Panse",
            Phone          = "+91-9000000002",
            Location       = "Mumbai, Maharashtra",
            BirthMonthYear = "Jan 1928",
            DeathMonthYear = "Dec 2000",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=MadhavPanse",
            CreatedBy      = panseAdmin.Id
        };
        var vijaya = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000015"),
            PrimaryTreeId  = panseTree.Id,
            FullName       = "Vijaya Panse",
            NameBefore     = "Apte",
            Phone          = "+91-9000000003",
            Location       = "Mumbai, Maharashtra",
            BirthMonthYear = "Aug 1932",
            DeathMonthYear = "Mar 2015",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=VijayaPanse",
            CreatedBy      = panseAdmin.Id
        };
        var arun = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000016"),
            PrimaryTreeId  = panseTree.Id,
            FullName       = "Arun Panse",
            Phone          = "+91-9876500001",
            Location       = "Pune, Maharashtra",
            BirthMonthYear = "Jun 1960",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=ArunPanse",
            CreatedBy      = panseAdmin.Id
        };
        var snehal = new Person
        {
            Id             = Guid.Parse("20000000-0000-0000-0000-000000000017"),
            PrimaryTreeId  = panseTree.Id,
            FullName       = "Snehal Panse",
            Phone          = "+91-9876500002",
            Location       = "Hyderabad, Telangana",
            BirthMonthYear = "Feb 1988",
            PhotoBlobUrl   = "https://api.dicebear.com/7.x/avataaars/svg?seed=SnehalPanse",
            CreatedBy      = panseAdmin.Id
        };

        db.Persons.AddRange(
            vishnupant, lakshmibai, ramchandra, sumitra, suresh, meena, anand, rahul, priya,
            dattatraya, saraswati, govind, shanta, madhav, vijaya, arun, snehal
        );

        // ── PersonTreeMemberships ──────────────────────────────────────────
        // All Sathe members (Meena is 'married_in')
        db.PersonTreeMemberships.AddRange(
            new PersonTreeMembership { PersonId = vishnupant.Id, FamilyTreeId = satheTree.Id, Role = "member",     AddedBy = satheAdmin.Id },
            new PersonTreeMembership { PersonId = lakshmibai.Id, FamilyTreeId = satheTree.Id, Role = "member",     AddedBy = satheAdmin.Id },
            new PersonTreeMembership { PersonId = ramchandra.Id, FamilyTreeId = satheTree.Id, Role = "member",     AddedBy = satheAdmin.Id },
            new PersonTreeMembership { PersonId = sumitra.Id,    FamilyTreeId = satheTree.Id, Role = "member",     AddedBy = satheAdmin.Id },
            new PersonTreeMembership { PersonId = suresh.Id,     FamilyTreeId = satheTree.Id, Role = "member",     AddedBy = satheAdmin.Id },
            new PersonTreeMembership { PersonId = meena.Id,      FamilyTreeId = satheTree.Id, Role = "married_in", AddedBy = satheAdmin.Id },
            new PersonTreeMembership { PersonId = anand.Id,      FamilyTreeId = satheTree.Id, Role = "member",     AddedBy = satheAdmin.Id },
            new PersonTreeMembership { PersonId = rahul.Id,      FamilyTreeId = satheTree.Id, Role = "member",     AddedBy = satheAdmin.Id },
            new PersonTreeMembership { PersonId = priya.Id,      FamilyTreeId = satheTree.Id, Role = "member",     AddedBy = satheAdmin.Id }
        );

        // All Panse members (Meena also gets a 'member' row here — the cross-tree key)
        db.PersonTreeMemberships.AddRange(
            new PersonTreeMembership { PersonId = dattatraya.Id, FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id },
            new PersonTreeMembership { PersonId = saraswati.Id,  FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id },
            new PersonTreeMembership { PersonId = govind.Id,     FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id },
            new PersonTreeMembership { PersonId = shanta.Id,     FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id },
            new PersonTreeMembership { PersonId = madhav.Id,     FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id },
            new PersonTreeMembership { PersonId = vijaya.Id,     FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id },
            new PersonTreeMembership { PersonId = meena.Id,      FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id },
            new PersonTreeMembership { PersonId = arun.Id,       FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id },
            new PersonTreeMembership { PersonId = snehal.Id,     FamilyTreeId = panseTree.Id, Role = "member", AddedBy = panseAdmin.Id }
        );

        // ── Person Details ─────────────────────────────────────────────────
        db.PersonDetails.AddRange(
            new PersonDetail
            {
                PersonId   = rahul.Id,
                Hobbies    = "Cricket, Photography, Trekking in Sahyadri ranges",
                Education  = "B.E. Computer Engineering, University of Pune (2002); MBA Finance, IIM Ahmedabad (2004)",
                Skills     = "Software Architecture, Project Management, Azure Cloud",
                Jobs       = """[{"title":"Software Engineer","company":"Infosys","start":"Jun 2002","end":"Dec 2005"},{"title":"Senior Engineer","company":"TCS","start":"Jan 2006","end":"Mar 2010"},{"title":"Tech Lead","company":"Wipro","start":"Apr 2010","end":"present"}]""",
                CustomFields = """{"languages":["Marathi","Hindi","English"],"passportNo":"redacted"}"""
            },
            new PersonDetail
            {
                PersonId   = priya.Id,
                Hobbies    = "Classical dance (Bharatanatyam), Cooking, Reading Marathi literature",
                Education  = "MBBS, B.J. Medical College Pune (2008); MD Paediatrics (2012)",
                Skills     = "Paediatrics, Child nutrition, Medical research",
                Jobs       = """[{"title":"Junior Doctor","company":"KEM Hospital Mumbai","start":"Aug 2008","end":"Jul 2012"},{"title":"Paediatric Consultant","company":"Lilavati Hospital","start":"Aug 2012","end":"present"}]""",
                CustomFields = """{"awards":["Best Resident 2011"],"languages":["Marathi","Hindi","English"]}"""
            },
            new PersonDetail
            {
                PersonId   = snehal.Id,
                Hobbies    = "Chess, Badminton, Startup mentoring",
                Education  = "B.Tech Electronics, VJTI Mumbai (2010); MS Computer Science, Georgia Tech (2012)",
                Skills     = "Machine Learning, Python, Product Management",
                Jobs       = """[{"title":"Data Scientist","company":"Amazon","start":"Jul 2012","end":"Dec 2016"},{"title":"Senior Product Manager","company":"Google","start":"Jan 2017","end":"present"}]""",
                CustomFields = """{"languages":["Marathi","Hindi","English","Kannada"]}"""
            }
        );

        // ── Pre-computed surname link (Sathe <-> Panse via Meena) ──────────
        db.SurnameLinks.Add(new SurnameLink
        {
            SurnameA          = "Sathe",
            SurnameB          = "Panse",
            LinkPersonId      = meena.Id,
            RelationshipLevel = 4,   // Sathe root → Suresh → Meena → Madhav → Panse root
            DetectedAt        = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }
}
