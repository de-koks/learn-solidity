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

if(!process.env.MINIMAL_AMOUNT_TO_ENTER) {
    throw new Error('MINIMAL_AMOUNT_TO_ENTER is not defined in the environment variables');
}
if(!process.env.MINIMAL_NUMBER_OF_PLAYERS) {
    throw new Error('MINIMAL_NUMBER_OF_PLAYERS is not defined in the environment variables');
}
const updatedMinimalAmountToEnter = parseInt(process.env.MINIMAL_AMOUNT_TO_ENTER, 10) * 2;
const updatedMinimalPlayersNumber = parseInt(process.env.MINIMAL_NUMBER_OF_PLAYERS, 10) + 1;

test.describe('Should update and verify updated values of minimalAmountToEnter and minimalPlayersNumber', () => {
    test('should update minimalAmountToEnter', async ({ request }) => {
        const updateMinimalAmountToEnter = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env.OWNER,
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
        expect(updateMinimalAmountToEnter.ok()).toBeTruthy();

        // call getMinimalAmountToEnter
        const getMinimalAmountToEnter = await request.post('/query', {
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
        expect(getMinimalAmountToEnter.ok()).toBeTruthy();

        const responseJson = await getMinimalAmountToEnter.json();
        expect(responseJson).toEqual(expect.objectContaining({
            result: updatedMinimalAmountToEnter
        }));
    });

    test('should not allow adding a player with initial minimal amount to enter', async ({ request }) => {
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
                    process.env.MINIMAL_AMOUNT_TO_ENTER
                ],
                "init": false
            }
        });
        expect(rejectPlayer.status()).toBe(500);

        const responseJson = await rejectPlayer.json();
        expect(responseJson.error).toEqual(
            expect.stringContaining(`Entry amount must be at least ${updatedMinimalAmountToEnter}`)
        );
    });

    test('should update minimalPlayersNumber', async ({ request }) => {
        const updateMinimalPlayersNumber = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY,
                },
                "func": "updateLotteryConfig",
                "args": [
                    "minimalPlayersNumber",
                    updatedMinimalPlayersNumber.toString()
                ],
                "init": false
            }
        });
        expect(updateMinimalPlayersNumber.ok()).toBeTruthy();

        // call getMinimalPlayersNumber
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
            result: updatedMinimalPlayersNumber
        }));
    });
});

test.describe('Should conduct lottery with updated params', () => {
    test('should not allow to pick a winner with initial minimal players number', async ({ request }) => {
        // make a loop to add pdatedMinimalPlayersNumber - 1 players
        for (let i = 1; i < updatedMinimalPlayersNumber; i++) {
            const addPlayer = await request.post('/transactions', {
                data: {
                    "headers": {
                        "type": "SendTransaction",
                        "signer": process.env[`PLAYER${i}`],
                        "channel": process.env.DEFAULT_CHANNEL,
                        "chaincode": process.env.LOTTERY,
                    },
                    "func": "enterLottery",
                    "args": [
                        updatedMinimalAmountToEnter.toString()
                    ],
                    "init": false
                }
            });
            expect(addPlayer.ok()).toBeTruthy();
        }
        // call pickWinner
        const rejectPickWinner = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY,
                },
                "func": "pickWinner",
                "args": [],
                "init": false
            }
        });
        expect(rejectPickWinner.status()).toBe(500);
        const responseJson = await rejectPickWinner.json();
        expect(responseJson.error).toEqual(
            expect.stringContaining(`Cannot pick a winner. At least ${updatedMinimalPlayersNumber} players are required.`)
        );
    });

    test('should pick a winner with updated minimal players number', async ({ request }) => {
        // add the last player - [updatedMinimalPlayersNumber]
        const addPlayer = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env[`PLAYER${updatedMinimalPlayersNumber}`],
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY,
                },
                "func": "enterLottery",
                "args": [
                    updatedMinimalAmountToEnter.toString()
                ],
                "init": false
            }
        });
        expect(addPlayer.ok()).toBeTruthy();

        // call pickWinner
        const pickWinner = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY,
                },
                "func": "pickWinner",
                "args": [],
                "init": false
            }
        });
        expect(pickWinner.ok()).toBeTruthy();
    });
});