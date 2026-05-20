namespace FamilyTree.Api.Models;

public record UserResponse(
    Guid Id,
    string Email,
    string? FullName,
    string Role
);
