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
      return cardTypeAgendaImage;
    case "asset":
      return cardTypeAssetImage;
    case "event":
      return cardTypeEventImage;
    case "hardware":
      return cardTypeHardwareImage;
    case "ice":
      return cardTypeIceImage;
    case "identity":
      return cardTypeIdentityImage;
    case "operation":
      return cardTypeOperationImage;
    case "program":
      return cardTypeProgramImage;
    case "resource":
      return cardTypeResourceImage;
    case "upgrade":
      return cardTypeUpgradeImage;
  }

  return "";
}
