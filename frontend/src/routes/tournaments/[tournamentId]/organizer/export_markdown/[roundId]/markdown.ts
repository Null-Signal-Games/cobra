import type { Pairing } from "$lib/model/Pairing";
import type { Player } from "$lib/model/Player";

export const MAX_MARKDOWN_PAGE_LENGTH = 2000;

export function pairingPlayerMarkdown(player: Player, isSingleSided: boolean): string {
  let markdown = `**${player.name_with_pronouns || player.name}**`;
  if (isSingleSided && player.side_label) {
    markdown += ` - ${player.side_label}`;
  }
  return markdown;
}

export function generateMarkdownPages(
  format: string,
  roundNumber: number,
  pairings: Pairing[],
  isSingleSided: boolean,
  maxLength = MAX_MARKDOWN_PAGE_LENGTH,
): string[] {
  if (pairings.length === 0) {
    return [];
  }

  const pageHeader = `# ${format} - Round ${roundNumber} Pairings`;
  const pages: string[] = [];
  let currentPage = pageHeader;

  for (const pairing of pairings) {
    let tableMarkdown = `\n### Table ${pairing.table_number}`;
    tableMarkdown += `\n- ${pairingPlayerMarkdown(pairing.player1, isSingleSided)}`;
    tableMarkdown += `\n- ${pairingPlayerMarkdown(pairing.player2, isSingleSided)}`;

    if (currentPage.length + tableMarkdown.length >= maxLength) {
      pages.push(currentPage);
      currentPage = pageHeader;
    }

    currentPage += tableMarkdown;
  }

  pages.push(currentPage);
  return pages;
}
