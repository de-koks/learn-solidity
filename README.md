# Learn Solidity Repository

## `hyperledger-contract` Branch
This branch contains a smart contract implemented with JavaScript to use in a Hyperledger blockchain. The contract is a lottery with the following features:

### Key Features:
1. **Owner Management**:
   - The lottery has one owner: the user who invokes the initialization method.
   - The owner cannot participate in the lottery as a player.
   - Only the owner can pick a winner or update the lottery configuration.

2. **Dynamic Configuration**:
   - The `minimalAmountToEnter` (minimum ticket price) and `minimalPlayersNumber` (minimum number of players required to pick a winner) are stored in the ledger.
   - These values can be updated by the owner, but only when the lottery is in its initial state (`isInitialState = true`).

3. **Initial State Management**:
   - The lottery has an `isInitialState` variable that tracks whether the lottery is in its initial state.
   - `isInitialState` is:
     - Set to `true` when the lottery is initialized or reset after picking a winner.
     - Set to `false` when a player enters the lottery.

4. **Player and Prize Management**:
   - Players are stored as an array in the ledger, with each player having a unique ID and the amount they contributed.
   - The prize pool is dynamically updated as players enter the lottery.

5. **Winner Selection**:
   - A winner is selected randomly from the list of players.
   - After a winner is picked:
     - The lottery logs the round statistics.
     - The lottery resets to its initial state.

6. **Lottery Statistics**:
   - The contract tracks and stores the following statistics in the ledger:
     - `lotteryRoundsTotal`: Total number of lottery rounds completed.
     - `participantsTotal`: Total number of participants across all rounds.
     - `prizeSentTotal`: Total prize amount sent to winners.

### Usage:
- **Initialization**:
  - The lottery is initialized by invoking the `initLottery` method. The user who invokes this method becomes the owner.
- **Entering the Lottery**:
  - Players can enter the lottery by specifying their entry amount, which must meet the `minimalAmountToEnter` requirement.
- **Picking a Winner**:
  - Only the owner can pick a winner, and there must be at least `minimalPlayersNumber` participants.

This contract is designed to be flexible, secure, and transparent, making it suitable for use in a Hyperledger blockchain environment.
