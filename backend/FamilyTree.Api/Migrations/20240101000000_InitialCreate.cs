using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyTree.Api.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id        = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Email     = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                FullName  = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                Role      = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "community_member"),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
            },
            constraints: table => table.PrimaryKey("PK_Users", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_Users_Email",
            table: "Users",
            column: "Email",
            unique: true);

        migrationBuilder.CreateTable(
            name: "FamilyTrees",
            columns: table => new
            {
                Id          = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                Surname     = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedBy   = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                CreatedAt   = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FamilyTrees", x => x.Id);
                table.ForeignKey("FK_FamilyTrees_Users_CreatedBy", x => x.CreatedBy,
                    principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "Persons",
            columns: table => new
            {
                Id             = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                PrimaryTreeId  = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                FullName       = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                NameBefore     = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                Phone          = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                Location       = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                BirthMonthYear = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                DeathMonthYear = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                PhotoBlobUrl   = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                ExtendedFields = table.Column<string>(type: "nvarchar(max)", nullable: true),
                CreatedBy      = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                CreatedAt      = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                UpdatedAt      = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Persons", x => x.Id);
                table.ForeignKey("FK_Persons_FamilyTrees_PrimaryTreeId", x => x.PrimaryTreeId,
                    principalTable: "FamilyTrees", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
                table.ForeignKey("FK_Persons_Users_CreatedBy", x => x.CreatedBy,
                    principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "PersonTreeMemberships",
            columns: table => new
            {
                PersonId     = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FamilyTreeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Role         = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "member"),
                AddedAt      = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                AddedBy      = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PersonTreeMemberships", x => new { x.PersonId, x.FamilyTreeId });
                table.ForeignKey("FK_PTM_Persons", x => x.PersonId,
                    principalTable: "Persons", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_PTM_FamilyTrees", x => x.FamilyTreeId,
                    principalTable: "FamilyTrees", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_PTM_Users_AddedBy", x => x.AddedBy,
                    principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "PersonDetails",
            columns: table => new
            {
                Id           = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                PersonId     = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Hobbies      = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Education    = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Skills       = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Jobs         = table.Column<string>(type: "nvarchar(max)", nullable: true),
                CustomFields = table.Column<string>(type: "nvarchar(max)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PersonDetails", x => x.Id);
                table.UniqueConstraint("AK_PersonDetails_PersonId", x => x.PersonId);
                table.ForeignKey("FK_PersonDetails_Persons_PersonId", x => x.PersonId,
                    principalTable: "Persons", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "FamilyTreeAdmins",
            columns: table => new
            {
                FamilyTreeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId       = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FamilyTreeAdmins", x => new { x.FamilyTreeId, x.UserId });
                table.ForeignKey("FK_FamilyTreeAdmins_FamilyTrees", x => x.FamilyTreeId,
                    principalTable: "FamilyTrees", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_FamilyTreeAdmins_Users", x => x.UserId,
                    principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "AuditLog",
            columns: table => new
            {
                Id         = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                UserId     = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                EntityType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                EntityId   = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Action     = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                OldValue   = table.Column<string>(type: "nvarchar(max)", nullable: true),
                NewValue   = table.Column<string>(type: "nvarchar(max)", nullable: true),
                ChangedAt  = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AuditLog", x => x.Id);
                table.ForeignKey("FK_AuditLog_Users", x => x.UserId,
                    principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "SurnameLinks",
            columns: table => new
            {
                Id                = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                SurnameA          = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                SurnameB          = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                LinkPersonId      = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                RelationshipLevel = table.Column<int>(type: "int", nullable: false),
                DetectedAt        = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SurnameLinks", x => x.Id);
                table.ForeignKey("FK_SurnameLinks_Persons_LinkPersonId", x => x.LinkPersonId,
                    principalTable: "Persons", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_SurnameLinks_Unique",
            table: "SurnameLinks",
            columns: new[] { "SurnameA", "SurnameB", "LinkPersonId" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SurnameLinks");
        migrationBuilder.DropTable(name: "AuditLog");
        migrationBuilder.DropTable(name: "FamilyTreeAdmins");
        migrationBuilder.DropTable(name: "PersonDetails");
        migrationBuilder.DropTable(name: "PersonTreeMemberships");
        migrationBuilder.DropTable(name: "Persons");
        migrationBuilder.DropTable(name: "FamilyTrees");
        migrationBuilder.DropTable(name: "Users");
    }
}
