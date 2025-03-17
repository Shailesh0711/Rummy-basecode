import shuffleCards from "./shuffleCards";
import distributeCards from "./distributeCards"
import autoMakeGroup from "./autoDefaultMakeGroup";
import setCardSuitWise from "./setCardSuitWise";
import pickupCardFromCloseDeck from "./pickupCardFromCloseDeck";
import pickupCardFromOpenDeck from "./pickupCardFromOpenDeck";
import reShuffleCards from "./reShuffleCards";
import discardCard from "./discardCard";

const exportObject = {
    shuffleCards,
    distributeCards,
    autoMakeGroup,
    setCardSuitWise,
    pickupCardFromCloseDeck,
    pickupCardFromOpenDeck,
    reShuffleCards,
    discardCard,
}

export = exportObject
