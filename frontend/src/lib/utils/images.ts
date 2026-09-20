import cardTypeAgendaImage from "../assets/images/types/agenda.png";
import cardTypeAssetImage from "../assets/images/types/asset.png";
import cardTypeEventImage from "../assets/images/types/event.png";
import cardTypeHardwareImage from "../assets/images/types/hardware.png";
import cardTypeIceImage from "../assets/images/types/ice.png";
import cardTypeIdentityImage from "../assets/images/types/identity.png";
import cardTypeOperationImage from "../assets/images/types/operation.png";
import cardTypeProgramImage from "../assets/images/types/program.png";
import cardTypeResourceImage from "../assets/images/types/resource.png";
import cardTypeUpgradeImage from "../assets/images/types/upgrade.png";

export function getCardTypeImage(cardTypeId: string) {
  switch (cardTypeId) {
    case "agenda":
      return cardTypeAgendaImage as string;
    case "asset":
      return cardTypeAssetImage as string;
    case "event":
      return cardTypeEventImage as string;
    case "hardware":
      return cardTypeHardwareImage as string;
    case "ice":
      return cardTypeIceImage as string;
    case "identity":
      return cardTypeIdentityImage as string;
    case "operation":
      return cardTypeOperationImage as string;
    case "program":
      return cardTypeProgramImage as string;
    case "resource":
      return cardTypeResourceImage as string;
    case "upgrade":
      return cardTypeUpgradeImage as string;
  }

  return "";
}
