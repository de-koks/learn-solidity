import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const updatedMinimalAmountToEnter = 50;
const updatedMinimalNumberOfPlayers = 2;

test.beforeAll(async ({ request }) => {
    // Call the method initializing a new lottery
    console.log('Executing beforeAll hook - Initializing a new lottery');
    const response = await request.post('/transactions', {
      data: {
        "headers": {
            "type": "SendTransaction",
            "signer": process.env.OWNER,
            "channel": process.env.DEFAULT_CHANNEL,
            "chaincode": process.env.LOTTERY,
          },
          "func": "initLottery",
          "args": [
            
          ],
          "init": false
        }
    });

    expect(response.ok()).toBeTruthy();
});

test.describe('Checks for the initial state of the lottery', () => {
    test('isInitialState flag should be true in the initial state', async ({ request}) => {
        const isInitialState = await request.post('/query', {
            data: {
                "headers": {
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY
                },
                "func": "getIsInitialState",
                "args": [],
                "strongread": true
            }
        });

        expect(isInitialState.ok()).toBeTruthy();

        // Parse the JSON response
        const responseJson = await isInitialState.json();

        // Check that the "result" field contains the expected value
        expect(responseJson).toEqual(expect.objectContaining({
            result: expect.objectContaining({
                isInitialState: true
            })
        }));
    });

    test('check the initial minimal amount ot enter', async ({ request}) => {
        const minimalAmountToEnter = await request.post('/query', {
            data: {
                "headers": {
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY
                },
                "func": "getMinimalAmountToEnter",
                "args": [],
                "strongread": true
            }
        });

        expect(minimalAmountToEnter.ok()).toBeTruthy();

        const responseJson = await minimalAmountToEnter.json();

        expect(responseJson).toEqual(expect.objectContaining({
            result: (() => {
                if (!process.env.MINIMAL_AMOUNT_TO_ENTER) {
                    throw new Error('MINIMAL_AMOUNT_TO_ENTER is not defined in the environment variables');
                }
                return parseInt(process.env.MINIMAL_AMOUNT_TO_ENTER, 10);
            })()
        }));
    });

    test('check the initial minimal number of players', async ({ request}) => {
        const getMinimalPlayersNumber = await request.post('/query', {
            data: {
                "headers": {
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY
                },
                "func": "getMinimalPlayersNumber",
                "args": [],
                "strongread": true
            }
        });

        expect(getMinimalPlayersNumber.ok()).toBeTruthy();

        const responseJson = await getMinimalPlayersNumber.json();

        expect(responseJson).toEqual(expect.objectContaining({
            result: (() => {
                if (!process.env.MINIMAL_NUMBER_OF_PLAYERS) {
                    throw new Error('MINIMAL_NUMBER_OF_PLAYERS is not defined in the environment variables');
                }
                return parseInt(process.env.MINIMAL_NUMBER_OF_PLAYERS, 10);
            })()
        }));
    });

    test('should be no players initially', async ({ request}) => {
        const getPlayers = await request.post('/query', {
            data: {
                "headers": {
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY
                },
                "func": "getPlayers",
                "args": [],
                "strongread": true
            }
        });

        expect(getPlayers.ok()).toBeTruthy();

        const responseJson = await getPlayers.json();

        expect(responseJson).toEqual(expect.objectContaining({
            result: []
        }));
    });
});

test.describe('Negative checks - should be rejected', () => {
    test('should not allow the owner to enter the lottery', async ({ request}) => {
        const rejectOwner = await request.post('/transactions', {
            data: {
            "headers": {
                "type": "SendTransaction",
                "signer": process.env.OWNER,
                "channel": process.env.DEFAULT_CHANNEL,
                "chaincode": process.env.LOTTERY,
                },
                "func": "enterLottery",
                "args": [
                process.env.MINIMAL_AMOUNT_TO_ENTER
                ],
                "init": false
            }
        });

        expect(rejectOwner.status()).toBe(500);

        const responseJson = await rejectOwner.json();

        expect(responseJson.error).toEqual(
            expect.stringContaining('The owner cannot enter the lottery.')
        );
    });

    test('should not add a player with insufficient amount', async ({ request}) => {
        if (!process.env.MINIMAL_AMOUNT_TO_ENTER) {
            throw new Error('MINIMAL_AMOUNT_TO_ENTER is not defined in the environment variables');
        }
        const insufficienAmount = Number(process.env.MINIMAL_AMOUNT_TO_ENTER) - 1;
        
        const rejectPlayer = await request.post('/transactions', {
            data: {
            "headers": {
                "type": "SendTransaction",
                "signer": process.env.PLAYER1,
                "channel": process.env.DEFAULT_CHANNEL,
                "chaincode": process.env.LOTTERY,
                },
                "func": "enterLottery",
                "args": [
                insufficienAmount.toString()
                ],
                "init": false
            }
        });

        expect(rejectPlayer.status()).toBe(500);

        const responseJson = await rejectPlayer.json();

        expect(responseJson.error).toEqual(
            expect.stringContaining(`Entry amount must be at least ${process.env.MINIMAL_AMOUNT_TO_ENTER}`)
        );
    });

    test('updateLotteryConfig should be rejected when called by non-owner', async ({ request}) => {
        const rejectUpdateLotteryConfig = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env.PLAYER1,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY,
                },
                "func": "updateLotteryConfig",
                "args": [
                    "minimalAmountToEnter",
                    updatedMinimalAmountToEnter.toString()
                ],
                "init": false
            }
        });
        expect(rejectUpdateLotteryConfig.status()).toBe(500);
        const responseJson = await rejectUpdateLotteryConfig.json();
        expect(responseJson.error).toEqual(
            expect.stringContaining('Only the owner can update the lottery configuration.')
        );
    });    
});

test.describe('Scenario to verify adding players and picking a winner', () => {
    test('should add a player with minimal amount', async ({ request}) => {
        // add player1
        const addPlayer1 = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env.PLAYER1,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY,
                },
                "func": "enterLottery",
                "args": [
                    process.env.MINIMAL_AMOUNT_TO_ENTER
                ],
                "init": false
            }
        });

        expect(addPlayer1.ok()).toBeTruthy();

        // call list of players
        const getPlayers = await request.post('/query', {
            data: {
                "headers": {
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY
                },
                "func": "getPlayers",
                "args": [],
                "strongread": true
            }
        });

        expect(getPlayers.ok()).toBeTruthy();

        const responseJson = await getPlayers.json();

        // Verify that the response contains player1 with minimal amount
        expect(responseJson).toEqual(expect.objectContaining({
            result: expect.arrayContaining([
                expect.objectContaining({
                    playerId: expect.stringContaining("player1"),
                    amount: (() => {
                        if (!process.env.MINIMAL_AMOUNT_TO_ENTER) {
                            throw new Error('MINIMAL_NUMBER_OF_PLAYERS is not defined in the environment variables');
                        }
                        return parseInt(process.env.MINIMAL_AMOUNT_TO_ENTER, 10);
                    })()
                })
            ])
        }));
    });
});