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
