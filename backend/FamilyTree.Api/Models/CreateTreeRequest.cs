using System.ComponentModel.DataAnnotations;

namespace FamilyTree.Api.Models;

public record CreateTreeRequest(
    [Required] string Surname,
    string? Description
);
