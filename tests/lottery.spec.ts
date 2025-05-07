import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

test.beforeAll(async ({ request }) => {
    // Call the method initializing a new lottery
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

test('lottery should be in the initial state', async ({ request}) => {
    const isInitialState = await request.post('/query', {
        data: {
            "headers": {
                "signer": process.env.OWNER,
                "channel": process.env.DEFAULT_CHANNEL,
                "chaincode": process.env.LOTTERY
            },
            "func": "getIsInitialState",
            "args": [
                
            ],
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
