/*
    * This smart contract is deployed on a Hyperledger Fabric network
    * to cover it with API tests.
    * It is not used in the current repository
    * thus IDE warnings are ignored.
*/

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

interface Player {
    playerId: string;
    amount: number;
}

@Info({ title: 'Lottery', description: 'Lottery smart contract' })
export class Lottery extends Contract {
    @Transaction()
    public async initLottery(ctx: Context): Promise<void> {
        const ownerId: string = ctx.clientIdentity.getID();

        await ctx.stub.putState('owner', Buffer.from(ownerId));
        await ctx.stub.putState('players', Buffer.from(JSON.stringify([])));
        await ctx.stub.putState('prizePool', Buffer.from('0'));
        await ctx.stub.putState('lotteryRoundsTotal', Buffer.from('0'));
        await ctx.stub.putState('participantsTotal', Buffer.from('0'));
        await ctx.stub.putState('prizeSentTotal', Buffer.from('0'));
        await ctx.stub.putState('isInitialState', Buffer.from('true'));
        await ctx.stub.putState('minimalAmountToEnter', Buffer.from('100'));
        await ctx.stub.putState('minimalPlayersNumber', Buffer.from('3'));
    }

    @Transaction()
    @Returns('string')
    public async updateLotteryConfig(ctx: Context, key: string, value: string): Promise<string> {
        const ownerId: string = (await ctx.stub.getState('owner')).toString();
        const callerId: string = ctx.clientIdentity.getID();

        if (callerId !== ownerId) {
            throw new Error('Only the owner can update the lottery configuration.');
        }

        const isInitialState: boolean = (await ctx.stub.getState('isInitialState')).toString() === 'true';
        if (!isInitialState) {
            throw new Error('Lottery configuration can only be updated when isInitialState is true.');
        }

        if (key !== 'minimalAmountToEnter' && key !== 'minimalPlayersNumber') {
            throw new Error('Invalid configuration key. Allowed keys are "minimalAmountToEnter" and "minimalPlayersNumber".');
        }

        const numericValue: number = parseInt(value, 10);
        if (isNaN(numericValue) || numericValue <= 0) {
            throw new Error('The value must be a positive number.');
        }

        await ctx.stub.putState(key, Buffer.from(numericValue.toString()));

        return `The configuration "${key}" has been updated to ${numericValue}.`;
    }

    @Transaction()
    @Returns('string')
    public async enterLottery(ctx: Context, amount: string): Promise<string> {
        const ownerId: string = (await ctx.stub.getState('owner')).toString();
        const callerId: string = ctx.clientIdentity.getID();

        if (callerId === ownerId) {
            throw new Error('The owner cannot enter the lottery.');
        }

        const playersData = await ctx.stub.getState('players');
        const players: Player[] = JSON.parse(playersData.toString());

        const prizePoolData = await ctx.stub.getState('prizePool');
        const prizePool: number = parseInt(prizePoolData.toString(), 10);

        const entryAmount: number = parseInt(amount, 10);
        if (isNaN(entryAmount) || entryAmount < 0) {
            throw new Error('Invalid entry amount');
        }

        const minimalAmountData = await ctx.stub.getState('minimalAmountToEnter');
        const minimalAmountToEnter: number = parseInt(minimalAmountData.toString(), 10);

        if (entryAmount < minimalAmountToEnter) {
            throw new Error(`Entry amount must be at least ${minimalAmountToEnter}`);
        }

        players.push({ playerId: callerId, amount: entryAmount });
        const updatedPrizePool = prizePool + entryAmount;

        await ctx.stub.putState('players', Buffer.from(JSON.stringify(players)));
        await ctx.stub.putState('prizePool', Buffer.from(updatedPrizePool.toString()));
        await ctx.stub.putState('isInitialState', Buffer.from('false'));

        return `Player ${callerId} entered the lottery with ${amount}`;
    }

    @Transaction()
    @Returns('string')
    public async pickWinner(ctx: Context): Promise<string> {
        const ownerId: string = (await ctx.stub.getState('owner')).toString();
        const callerId: string = ctx.clientIdentity.getID();

        if (callerId !== ownerId) {
            throw new Error('Only the owner can pick a winner.');
        }

        const playersData = await ctx.stub.getState('players');
        const players: Player[] = JSON.parse(playersData.toString());

        const prizePoolData = await ctx.stub.getState('prizePool');
        const prizePool: number = parseInt(prizePoolData.toString(), 10);

        const minimalPlayersData = await ctx.stub.getState('minimalPlayersNumber');
        const minimalPlayersNumber: number = parseInt(minimalPlayersData.toString(), 10);

        if (players.length < minimalPlayersNumber) {
            throw new Error(`Cannot pick a winner. At least ${minimalPlayersNumber} players are required.`);
        }

        const winnerIndex: number = Math.floor(Math.random() * players.length);
        const winner: Player = players[winnerIndex];

        const lotteryRoundsTotal = parseInt((await ctx.stub.getState('lotteryRoundsTotal')).toString(), 10) + 1;
        const participantsTotal = parseInt((await ctx.stub.getState('participantsTotal')).toString(), 10) + players.length;
        const prizeSentTotal = parseInt((await ctx.stub.getState('prizeSentTotal')).toString(), 10) + prizePool;

        await ctx.stub.putState('lotteryRoundsTotal', Buffer.from(lotteryRoundsTotal.toString()));
        await ctx.stub.putState('participantsTotal', Buffer.from(participantsTotal.toString()));
        await ctx.stub.putState('prizeSentTotal', Buffer.from(prizeSentTotal.toString()));

        await ctx.stub.putState('players', Buffer.from(JSON.stringify([])));
        await ctx.stub.putState('prizePool', Buffer.from('0'));
        await ctx.stub.putState('isInitialState', Buffer.from('true'));

        return `Winner is ${winner.playerId} with prize ${prizePool}`;
    }

    // Read-only getters

    @Transaction(false)
    @Returns('number')
    public async getMinimalAmountToEnter(ctx: Context): Promise<number> {
        const minimalAmountToEnter = parseInt((await ctx.stub.getState('minimalAmountToEnter')).toString(), 10);
        return minimalAmountToEnter;
    }

    @Transaction(false)
    @Returns('number')
    public async getMinimalPlayersNumber(ctx: Context): Promise<number> {
        const minimalPlayersNumber = parseInt((await ctx.stub.getState('minimalPlayersNumber')).toString(), 10);
        return minimalPlayersNumber;
    }

    @Transaction(false)
    @Returns('Player[]')
    public async getPlayers(ctx: Context): Promise<Player[]> {
        const players = JSON.parse((await ctx.stub.getState('players')).toString());
        return players;
    }

    @Transaction(false)
    @Returns('number')
    public async getPrizePool(ctx: Context): Promise<number> {
        const prizePool = parseInt((await ctx.stub.getState('prizePool')).toString(), 10);
        return prizePool;
    }

    @Transaction(false)
    @Returns('object')
    public async getLotteryStats(ctx: Context): Promise<{ lotteryRoundsTotal: number; participantsTotal: number; prizeSentTotal: number }> {
        const lotteryRoundsTotal = parseInt((await ctx.stub.getState('lotteryRoundsTotal')).toString(), 10);
        const participantsTotal = parseInt((await ctx.stub.getState('participantsTotal')).toString(), 10);
        const prizeSentTotal = parseInt((await ctx.stub.getState('prizeSentTotal')).toString(), 10);

        return {
            lotteryRoundsTotal,
            participantsTotal,
            prizeSentTotal,
        };
    }

    @Transaction(false)
    @Returns('object')
    public async getIsInitialState(ctx: Context): Promise<{ isInitialState: boolean }> {
        const isInitialState = (await ctx.stub.getState('isInitialState')).toString() === 'true';
        return { isInitialState };
    }

    @Transaction(false)
    @Returns('object')
    public async getOwner(ctx: Context): Promise<{ owner: string }> {
        const owner = (await ctx.stub.getState('owner')).toString();
        return { owner };
    }
}
 