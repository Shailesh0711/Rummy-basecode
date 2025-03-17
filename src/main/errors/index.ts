import InvalidInput from "./invalidInput";
import UnknownError from './unknown';
import CancelBattle from './cancelBattle';
import InsufficientFundError from './insufficientFunds';
import createCardGameTableError from './createCardGameTable';
import DistributeCardsError from './distributeCards';
import maintanenceError from "./maintanenceError";

const exportObject = {
    InvalidInput,
    UnknownError,
    CancelBattle,
    InsufficientFundError,
    createCardGameTableError,
    DistributeCardsError,
    maintanenceError
}

export = exportObject