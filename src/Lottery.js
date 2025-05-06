const { Contract, Context } = require('fabric-contract-api');

'use strict';

class Lottery extends Contract {
    /**
     * Initializes the lottery contract by setting up the initial state.
     * The owner of the lottery is set to the user invoking this method.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<void>}
     */
    async initLottery(ctx) {
        // Retrieve the ownerId from the context
        const ownerId = ctx.clientIdentity.getID();

        // Set the owner of the lottery
        await ctx.stub.putState('owner', Buffer.from(ownerId));

        // Initialize players as an empty array
        await ctx.stub.putState('players', JSON.stringify([]));
        // Initialize the rest of variables as 0
        await ctx.stub.putState('prizePool', Buffer.from('0'));
        await ctx.stub.putState('lotteryRoundsTotal', Buffer.from('0'));
        await ctx.stub.putState('participantsTotal', Buffer.from('0'));
        await ctx.stub.putState('prizeSentTotal', Buffer.from('0'));
        // Initialize isInitialState as true
        await ctx.stub.putState('isInitialState', Buffer.from('true'));

        // Initialize minimalAmountToEnter and minimalPlayersNumber
        await ctx.stub.putState('minimalAmountToEnter', Buffer.from('100'));
        await ctx.stub.putState('minimalPlayersNumber', Buffer.from('3'));
    }

    /**
     * Updates the minimalAmountToEnter or minimalPlayersNumber.
     * Only the owner can update these values, and only when isInitialState = true.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @param {string} key - The key to update ('minimalAmountToEnter' or 'minimalPlayersNumber').
     * @param {string} value - The new value to set.
     * @returns {Promise<string>} A message confirming the update.
     * @throws {Error} If the caller is not the owner or if isInitialState is not true.
     */
    async updateLotteryConfig(ctx, key, value) {
        // Retrieve the ownerId from the ledger
        const ownerId = (await ctx.stub.getState('owner')).toString();
        // Retrieve the caller's ID
        const callerId = ctx.clientIdentity.getID();

        // Check if the caller is the owner
        if (callerId !== ownerId) {
            throw new Error('Only the owner can update the lottery configuration.');
        }

        // Check if isInitialState is true
        const isInitialState = (await ctx.stub.getState('isInitialState')).toString() === 'true';
        if (!isInitialState) {
            throw new Error('Lottery configuration can only be updated when isInitialState is true.');
        }

        // Validate the key
        if (key !== 'minimalAmountToEnter' && key !== 'minimalPlayersNumber') {
            throw new Error('Invalid configuration key. Allowed keys are "minimalAmountToEnter" and "minimalPlayersNumber".');
        }

        // Validate the value
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue) || numericValue <= 0) {
            throw new Error('The value must be a positive number.');
        }

        // Update the value in the ledger
        await ctx.stub.putState(key, Buffer.from(numericValue.toString()));

        return `The configuration "${key}" has been updated to ${numericValue}.`;
    }

    /**
     * Allows a player to enter the lottery by specifying their player ID and entry amount.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @param {string} amount - The entry amount as a string (e.g., "100").
     * @returns {Promise<string>} A message confirming the player's entry into the lottery.
     * @throws {Error} If the entry amount is invalid (not a number, less than the minimal amount, or invoked by the owner).
     */
    async enterLottery(ctx, amount) {
        // Retrieve the ownerId from the ledger
        const ownerId = (await ctx.stub.getState('owner')).toString();
        // Retrieve the caller's ID
        const callerId = ctx.clientIdentity.getID();

        // Check if the caller is the owner
        if (callerId === ownerId) {
            throw new Error('The owner cannot enter the lottery.');
        }

        const players = JSON.parse(await ctx.stub.getState('players'));
        const prizePool = parseInt((await ctx.stub.getState('prizePool')).toString(), 10);
        const entryAmount = parseInt(amount, 10);

        if (isNaN(entryAmount) || entryAmount < 0) {
            throw new Error('Invalid entry amount');
        }

        if (entryAmount < this.minimalAmountToEnter) {
            throw new Error(`Entry amount must be at least ${this.minimalAmountToEnter}`);
        }

        players.push({ playerId: callerId, amount: entryAmount });
        const updatedPrizePool = prizePool + entryAmount;

        await ctx.stub.putState('players', JSON.stringify(players));
        await ctx.stub.putState('prizePool', Buffer.from(updatedPrizePool.toString()));

        // Set isInitialState to false
        await ctx.stub.putState('isInitialState', Buffer.from('false'));

        return `Player ${callerId} entered the lottery with ${amount}`;
    }

    /**
     * Picks a random winner from the list of players in the lottery.
     * Logs the lottery round, total participants, and total prize sent before resetting the lottery.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<string>} A message announcing the winner and the prize amount.
     * @throws {Error} If there are no players, fewer than the minimal number of players, or invoked by a non-owner.
     */
    async pickWinner(ctx) {
        // Retrieve the ownerId from the ledger
        const ownerId = (await ctx.stub.getState('owner')).toString();
        // Retrieve the caller's ID
        const callerId = ctx.clientIdentity.getID();

        // Check if the caller is the owner
        if (callerId !== ownerId) {
            throw new Error('Only the owner can pick a winner.');
        }

        const players = JSON.parse(await ctx.stub.getState('players'));
        const prizePool = parseInt((await ctx.stub.getState('prizePool')).toString(), 10);

        // Retrieve minimalPlayersNumber from the ledger
        const minimalPlayersNumber = parseInt((await ctx.stub.getState('minimalPlayersNumber')).toString(), 10);

        if (players.length < minimalPlayersNumber) {
            throw new Error(`Cannot pick a winner. At least ${minimalPlayersNumber} players are required.`);
        }

        const winnerIndex = Math.floor(Math.random() * players.length);
        const winner = players[winnerIndex];

        // Update and log lottery statistics
        const lotteryRoundsTotal = parseInt((await ctx.stub.getState('lotteryRoundsTotal')).toString(), 10) + 1;
        const participantsTotal = parseInt((await ctx.stub.getState('participantsTotal')).toString(), 10) + players.length;
        const prizeSentTotal = parseInt((await ctx.stub.getState('prizeSentTotal')).toString(), 10) + prizePool;

        await ctx.stub.putState('lotteryRoundsTotal', Buffer.from(lotteryRoundsTotal.toString()));
        await ctx.stub.putState('participantsTotal', Buffer.from(participantsTotal.toString()));
        await ctx.stub.putState('prizeSentTotal', Buffer.from(prizeSentTotal.toString()));

        // Reset the lottery state
        await ctx.stub.putState('players', JSON.stringify([])); // Reset players to an empty array
        await ctx.stub.putState('prizePool', Buffer.from('0')); // Reset prizePool to 0

        // Set isInitialState to true
        await ctx.stub.putState('isInitialState', Buffer.from('true'));

        return `Winner is ${winner.playerId} with prize ${prizePool}`;
    }

    //only getters are below

    /**
     * Retrieves the current value of minimalAmountToEnter.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<number>} The current value of minimalAmountToEnter.
     */
    async getMinimalAmountToEnter(ctx) {
        const minimalAmountToEnter = parseInt((await ctx.stub.getState('minimalAmountToEnter')).toString(), 10);
        return minimalAmountToEnter;
    }

    /**
     * Retrieves the current value of minimalPlayersNumber.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<number>} The current value of minimalPlayersNumber.
     */
    async getMinimalPlayersNumber(ctx) {
        const minimalPlayersNumber = parseInt((await ctx.stub.getState('minimalPlayersNumber')).toString(), 10);
        return minimalPlayersNumber;
    }

    /**
     * Retrieves the current list of players in the lottery.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<Array>} The list of players as a JSON array.
     */
    async getPlayers(ctx) {
        const players = JSON.parse(await ctx.stub.getState('players'));
        return players;
    }

    /**
     * Retrieves the current prize pool of the lottery.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<number>} The current prize pool as a number.
     */
    async getPrizePool(ctx) {
        const prizePool = parseInt((await ctx.stub.getState('prizePool')).toString(), 10);
        return prizePool;
    }

    /**
     * Retrieves the lottery statistics, including total rounds, participants, and prizes sent.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<Object>} The lottery statistics as a JSON object.
     */
    async getLotteryStats(ctx) {
        const lotteryRoundsTotal = parseInt((await ctx.stub.getState('lotteryRoundsTotal')).toString(), 10);
        const participantsTotal = parseInt((await ctx.stub.getState('participantsTotal')).toString(), 10);
        const prizeSentTotal = parseInt((await ctx.stub.getState('prizeSentTotal')).toString(), 10);

        return {
            lotteryRoundsTotal,
            participantsTotal,
            prizeSentTotal,
        };
    }

    /**
     * Retrieves the current state of the isInitialState variable.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<boolean>} The current value of isInitialState.
     */
    async getIsInitialState(ctx) {
        const isInitialState = (await ctx.stub.getState('isInitialState')).toString() === 'true';
        return { isInitialState };
    }

    /**
     * Retrieves the owner of the lottery.
     * @param {Context} ctx - The transaction context provided by the Fabric framework.
     * @returns {Promise<string>} The owner of the lottery.
     */
    async getOwner(ctx) {
        const owner = (await ctx.stub.getState('owner')).toString();
        return { owner };
    }
}

module.exports = Lottery;