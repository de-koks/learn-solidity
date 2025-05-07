import { test, expect } from '@playwright/test';

const OWNER = 'user1';
const PLAYER1 = 'player1';
const PLAYER2 = 'player2';
const PLAYER3 = 'player3';
const PLAYER4 = 'player4';

test.beforeAll(async ({ request }) => {
    // Call the method initializing a new lottery
    const response = await request.post('/transactions', {
      data: {
        "headers": {
            "type": "SendTransaction",
            "signer": OWNER,
            "channel": "default-channel",
            "chaincode": "lottery",
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
                "signer": OWNER,
                "channel": "default-channel",
                "chaincode": "lottery"
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
