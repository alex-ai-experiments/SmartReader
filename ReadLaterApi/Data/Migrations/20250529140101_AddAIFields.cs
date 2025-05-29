using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReadLaterApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAIFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Keywords",
                table: "Articles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NamedEntities",
                table: "Articles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TextSummary",
                table: "Articles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Keywords",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "NamedEntities",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "TextSummary",
                table: "Articles");
        }
    }
}
