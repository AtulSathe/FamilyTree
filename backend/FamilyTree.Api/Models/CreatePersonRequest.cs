using System.ComponentModel.DataAnnotations;

namespace FamilyTree.Api.Models;

public record CreatePersonRequest(
    [Required] string FullName,
    string? NameBefore,
    string? Phone,
    string? Location,
    string? BirthMonthYear,
    string? DeathMonthYear,
    [Required] Guid TreeId,
    string Role = "member"   // member | married_in | admin_linked
);
