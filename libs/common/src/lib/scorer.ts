import { HandHelper } from './internal/hand-helper';
import { calculatePayments, countFu, } from './points-calculator';
import { defaultLimits } from './rules/limits';
import { defaultFuDefinitions } from './rules/points';
import { defaultYakuCollection } from './rules/yaku';
import { Mahjong } from './types/hand';
import { CountedFu, CountedYaku, PaymentInfo } from './types/points';
import { WinState } from './types/win-state';
import { countYaku } from './yaku-calculator';

export interface ScoredHand {
    readonly mahjong: Mahjong;
    readonly state: WinState;
    readonly yaku: readonly CountedYaku[];
    readonly fu: readonly CountedFu[];
    readonly payment: PaymentInfo;

    readonly totalHan: number;
    readonly totalFu: number;
}

const defaultRules = {
    yaku: defaultYakuCollection,
    fu: defaultFuDefinitions,
    limits: defaultLimits
};

export function getWinningScore(mahjong: Mahjong, round: WinState, rules = defaultRules): ScoredHand {
    const helper = new HandHelper(mahjong, round);
    const yaku = countYaku(helper, rules.yaku);
    const fu = countFu(helper, rules.fu);

    const totalFu = fu.reduce((total, f) => total + f.definition.fu, 0);
    const totalHan = yaku.reduce((total, y) => total + y.han + y.extras.length, 0);

    const payments = calculatePayments(helper, totalHan, totalFu, rules.limits);

    return {
        mahjong: mahjong,
        state: round,
        yaku: yaku,
        fu: fu,
        totalFu: totalFu,
        totalHan: totalHan,
        payment: payments
    };
}
