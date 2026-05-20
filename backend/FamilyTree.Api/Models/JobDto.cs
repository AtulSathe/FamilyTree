namespace FamilyTree.Api.Models;

public record JobDto(
    string? Title,
    string? Company,
    string? StartMMYYYY,
    string? EndMMYYYY
);
