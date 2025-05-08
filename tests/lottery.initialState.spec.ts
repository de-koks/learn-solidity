import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

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
    test('should return the owner', async ({ request}) => {
        const getOwner = await request.post('/query', {
            data: {
                "headers": {
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY
                },
                "func": "getOwner",
                "args": [],
                "strongread": true
            }
        });
        expect(getOwner.ok()).toBeTruthy();

        // Parse the JSON response
        const responseJson = await getOwner.json();

        if (!process.env.OWNER) {
            throw new Error('process.env.OWNER is not defined in the environment variables');
        }      
        expect(responseJson).toEqual(expect.objectContaining({
            result: expect.objectContaining({
                owner: expect.stringContaining(process.env.OWNER)
            })
        }));
    });

    test('isInitialState flag should be true', async ({ request}) => {
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

    test('prizePool should be zero', async ({ request}) => {
        const prizePool = await request.post('/query', {
            data: {
                "headers": {
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY
                },
                "func": "getPrizePool",
                "args": [],
                "strongread": true
            }
        });
        expect(prizePool.ok()).toBeTruthy();

        const responseJson = await prizePool.json();
        expect(responseJson).toEqual(expect.objectContaining({
            result: 0
        }));
    });

    test('lottery statistics should be zero', async ({ request}) => {
        const lotteryStats = await request.post('/query', {
            data: {
                "headers": {
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY
                },
                "func": "getLotteryStats",
                "args": [],
                "strongread": true
            }
        });
        expect(lotteryStats.ok()).toBeTruthy();

        const responseJson = await lotteryStats.json();
        expect(responseJson).toEqual(expect.objectContaining({
            result: expect.objectContaining({
                lotteryRoundsTotal: 0,
                participantsTotal: 0,
                prizeSentTotal: 0
            })
        }));
    });

    test('minimalAmountToEnter should have the initial value', async ({ request}) => {
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

    test('minimalPlayersNumber should have the initial value', async ({ request}) => {
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

    test('should be no players', async ({ request}) => {
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
