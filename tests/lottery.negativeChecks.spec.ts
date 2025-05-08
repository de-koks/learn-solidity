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

test.describe('Negative checks for enterLottery()', () => {    
    test('should reject the owner', async ({ request}) => {
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

    test('should reject a player with insufficient amount', async ({ request}) => {
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

    test('should reject a player with NaN amount', async ({ request}) => {        
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
                    "NaN"
                ],
                "init": false
            }
        });

        expect(rejectPlayer.status()).toBe(500);

        const responseJson = await rejectPlayer.json();

        expect(responseJson.error).toEqual(
            expect.stringContaining('Invalid entry amount')
        );
    });
});

test.describe('Negative checks for updateLotteryConfig()', () => {
    test('should reject when called by non-owner', async ({ request}) => {
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

    test('should reject when wrong config parameter key is provided', async ({ request}) => {
        const rejectUpdateLotteryConfig = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env.OWNER,
                    "channel": process.env.DEFAULT_CHANNEL,
                    "chaincode": process.env.LOTTERY,
                },
                "func": "updateLotteryConfig",
                "args": [
                    "wrongKey",
                    updatedMinimalAmountToEnter.toString()
                ],
                "init": false
            }
        });
        expect(rejectUpdateLotteryConfig.status()).toBe(500);

        const responseJson = await rejectUpdateLotteryConfig.json();
        expect(responseJson.error).toEqual(
            expect.stringContaining('Invalid configuration key. Allowed keys are "minimalAmountToEnter" and "minimalPlayersNumber".')
        );
    });

    test('should reject when config parameter value is NaN', async ({ request}) => {
        const rejectUpdateLotteryConfig = await request.post('/transactions', {
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
                    "NaN"
                ],
                "init": false
            }
        });
        expect(rejectUpdateLotteryConfig.status()).toBe(500);

        const responseJson = await rejectUpdateLotteryConfig.json();
        expect(responseJson.error).toEqual(
            expect.stringContaining('The value must be a positive number.')
        );
    });

    test('should reject when config parameter value is zero', async ({ request}) => {
        const rejectUpdateLotteryConfig = await request.post('/transactions', {
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
                    "0"
                ],
                "init": false
            }
        });
        expect(rejectUpdateLotteryConfig.status()).toBe(500);

        const responseJson = await rejectUpdateLotteryConfig.json();
        expect(responseJson.error).toEqual(
            expect.stringContaining('The value must be a positive number.')
        );
    });

    test('should reject when isInitialState == false', async ({ request}) => {
        // Add a player to turn isInitialState to false
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
        
        const rejectUpdateLotteryConfig = await request.post('/transactions', {
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
                    "2"
                ],
                "init": false
            }
        });
        expect(rejectUpdateLotteryConfig.status()).toBe(500);

        const responseJson = await rejectUpdateLotteryConfig.json();
        expect(responseJson.error).toEqual(
            expect.stringContaining('Lottery configuration can only be updated when isInitialState is true.')
        );
    });
});

test.describe('Negative checks for pickWinner()', () => {
    test('should reject when called by non-owner', async ({ request}) => {
        const rejectPickWinner = await request.post('/transactions', {
            data: {
                "headers": {
                    "type": "SendTransaction",
                    "signer": process.env.PLAYER1,
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
            expect.stringContaining('Only the owner can pick a winner.')
        );
    });

    test('should reject whennumber of players is less than minimalPlayersNumber', async ({ request}) => {
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
            expect.stringContaining(`Cannot pick a winner. At least ${process.env.MINIMAL_NUMBER_OF_PLAYERS} players are required.`)
        );
    });
});
