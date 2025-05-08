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


test.describe('Scenario to verify adding players and picking a winner', () => {
    test('should add a player with minimal amount', async ({ request }) => {
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

        // Verify that the response contains player1 with minimal amount
        const responseJson = await getPlayers.json();
        expect(responseJson).toEqual(expect.objectContaining({
            result: expect.arrayContaining([
                expect.objectContaining({
                    playerId: (() => {
                        if (!process.env.PLAYER1) {
                            throw new Error('PLAYER1 is not defined in the environment variables');
                        }
                        return expect.stringContaining(process.env.PLAYER1);
                    })(),
                    amount: (() => {
                        if (!process.env.MINIMAL_AMOUNT_TO_ENTER) {
                            throw new Error('MINIMAL_AMOUNT_TO_ENTER is not defined in the environment variables');
                        }
                        return parseInt(process.env.MINIMAL_AMOUNT_TO_ENTER, 10);
                    })()
                })
            ])
        }));
    });

    test('isInitialState should be false', async ({ request }) => {
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

        const responseJson = await isInitialState.json();
        expect(responseJson).toEqual(expect.objectContaining({
            result: expect.objectContaining({
                isInitialState: false
            })
        }));
    });
});
