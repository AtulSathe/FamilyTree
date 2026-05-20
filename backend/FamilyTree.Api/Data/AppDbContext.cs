using FamilyTree.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace FamilyTree.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Domain.FamilyTree> FamilyTrees => Set<Domain.FamilyTree>();
    public DbSet<Person> Persons => Set<Person>();
    public DbSet<PersonTreeMembership> PersonTreeMemberships => Set<PersonTreeMembership>();
    public DbSet<PersonDetail> PersonDetails => Set<PersonDetail>();
    public DbSet<User> Users => Set<User>();
    public DbSet<FamilyTreeAdmin> FamilyTreeAdmins => Set<FamilyTreeAdmin>();
    public DbSet<AuditLog> AuditLog => Set<AuditLog>();
    public DbSet<SurnameLink> SurnameLinks => Set<SurnameLink>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Composite PKs
        modelBuilder.Entity<PersonTreeMembership>()
            .HasKey(m => new { m.PersonId, m.FamilyTreeId });

        modelBuilder.Entity<FamilyTreeAdmin>()
            .HasKey(a => new { a.FamilyTreeId, a.UserId });

        // Person -> PrimaryTree: nullable FK, no cascade delete
        modelBuilder.Entity<Person>()
            .HasOne(p => p.PrimaryTree)
            .WithMany()
            .HasForeignKey(p => p.PrimaryTreeId)
            .OnDelete(DeleteBehavior.SetNull);

        // PersonDetail -> Person: one-to-one
        modelBuilder.Entity<PersonDetail>()
            .HasOne(pd => pd.Person)
            .WithOne(p => p.Detail)
            .HasForeignKey<PersonDetail>(pd => pd.PersonId)
            .OnDelete(DeleteBehavior.Cascade);

        // PersonTreeMembership -> FamilyTree: no cascade (delete tree manually)
        modelBuilder.Entity<PersonTreeMembership>()
            .HasOne(m => m.FamilyTree)
            .WithMany(t => t.PersonMemberships)
            .HasForeignKey(m => m.FamilyTreeId)
            .OnDelete(DeleteBehavior.Restrict);

        // PersonTreeMembership -> Person
        modelBuilder.Entity<PersonTreeMembership>()
            .HasOne(m => m.Person)
            .WithMany(p => p.TreeMemberships)
            .HasForeignKey(m => m.PersonId)
            .OnDelete(DeleteBehavior.Cascade);

        // FamilyTreeAdmin -> FamilyTree / User
        modelBuilder.Entity<FamilyTreeAdmin>()
            .HasOne(a => a.FamilyTree)
            .WithMany(t => t.Admins)
            .HasForeignKey(a => a.FamilyTreeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FamilyTreeAdmin>()
            .HasOne(a => a.User)
            .WithMany(u => u.AdminTrees)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // SurnameLink unique constraint
        modelBuilder.Entity<SurnameLink>()
            .HasIndex(s => new { s.SurnameA, s.SurnameB, s.LinkPersonId })
            .IsUnique();

        // AuditLog -> User: no cascade (keep log even if user deleted)
        modelBuilder.Entity<AuditLog>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
