const { ENDPOINTS } = require('../config/endpoints');
const {
    sendRequest
} = require('../helpers/sendRequest');

describe('Lottery test suite', () => {
    it('should receive the owner', async () => {
        if (!process.env.OWNER_ADDRESS) {
            throw new Error("OWNER_ADDRESS environment variable is not set.");
        };
        const response = await sendRequest(ENDPOINTS.LOTTERY_ORGANIZER);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property(
            'output',
            process.env.OWNER_ADDRESS
        );
    });

    it('should receive the minimal ticket price', async () => {
        if (!process.env.MINIMAL_TICKET_PRICE) {
            throw new Error("MINIMAL_TICKET_PRICE environment variable is not set.");
        };
        const response = await sendRequest(ENDPOINTS.MINIMAL_TICKET_PRICE);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property(
            'output',
            process.env.MINIMAL_TICKET_PRICE
        );
    });

    it('should reject a call for the 1st participant', async () => {
        const response = await sendRequest(ENDPOINTS.PARTICIPANTS, 'get', {
            input: 0
        });

        expect(response.status).to.equal(500);
        expect(response.data).to.have.property(
            'error',
            'Call failed: execution reverted'
        );
    });

    /*
    We need to verify that prize fund is updated
    once a player enters the lottery
    and when the lottery is launched.
    Here the initial value is saved.
    */
    let prizeFund;
    it('should receive prizeFund', async () => {
        const response = await sendRequest(ENDPOINTS.PRIZE_FUND);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('output');
        expect(response.data.output).to.be.a('string');
        prizeFund = response.data.output;
    });

    it('prizeFund shouldd be zero initially', () => {
        expect(prizeFund).to.equal('0');
    });

    /*
    We need to virify that the lotery records logs,
    here the initial values are saved.
    */
    let initialLotteryRoundsTotal;
    it('should receive lotteryRoundsTotal', async () => {
        const response = await sendRequest(ENDPOINTS.LOTTERY_ROUNDS_TOTAL);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('output');
        expect(response.data.output).to.be.a('string');
        initialLotteryRoundsTotal = response.data.output;
    });

    let initialParticipantsTotal;
    it('should receive participantsTotal', async () => {
        const response = await sendRequest(ENDPOINTS.PARTICIPANTS_TOTAL);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('output');
        expect(response.data.output).to.be.a('string');
        initialParticipantsTotal = response.data.output;
    });

    let initialPrizeSentTotal;
    it('should receive prizeSentTotal', async () => {
        const response = await sendRequest(ENDPOINTS.PRIZE_SENT_TOTAL);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('output');
        expect(response.data.output).to.be.a('string');
        initialPrizeSentTotal = response.data.output;
    });

    it('enterLottery should reject the owner with minimal ticket price', async () => {
        if(!process.env.OWNER_ADDRESS) {
            throw new Error("OWNER_ADDRESS environment variable is not set.");
        }
        if(!process.env.MINIMAL_TICKET_PRICE) {
            throw new Error("MINIMAL_TICKET_PRICE environment variable is not set.");
        }
        const response = await sendRequest(ENDPOINTS.ENTER_LOTTERY, 'post', {
            'kld-from': process.env.OWNER_ADDRESS,
            'kld-ethvalue': process.env.MINIMAL_TICKET_PRICE,
            'kld-sync': true,
        });

        expect(response.status).to.equal(500);
        expect(response.data).to.have.property(
            'error',
            'Call failed: execution reverted: Lottery organizer is not allowed to participate.'
        );
    });

    it('enterLottery should reject a player with minimal price - 1', async () => {
        if(!process.env.PLAYER1_ADDRESS) {
            throw new Error("PLAYER1_ADDRESS environment variable is not set.");
        }
        if(!process.env.MINIMAL_TICKET_PRICE) {
            throw new Error("MINIMAL_TICKET_PRICE environment variable is not set.");
        }
        const insufficientValue = BigInt(process.env.MINIMAL_TICKET_PRICE) - 1n;
        const response = await sendRequest(ENDPOINTS.ENTER_LOTTERY, 'post', {
            'kld-from': process.env.PLAYER1_ADDRESS,
            'kld-ethvalue': insufficientValue.toString(),
            'kld-sync': true,
        });

        expect(response.status).to.equal(500);
        expect(response.data).to.have.property(
            'error',
            'Call failed: execution reverted: Transferred value is not enough to participate in the lottery. Check for public constant minimalTicketPrice.'
        );
    });

    // initialize a variable to store the total value sent by entering players
    let currentPrizeFund;
    it('enterLottery should accept a player with minimal price', async () => {
        if(!process.env.PLAYER1_ADDRESS) {
            throw new Error("PLAYER1_ADDRESS environment variable is not set.");
        }
        if(!process.env.MINIMAL_TICKET_PRICE) {
            throw new Error("MINIMAL_TICKET_PRICE environment variable is not set.");
        }
        const response = await sendRequest(ENDPOINTS.ENTER_LOTTERY, 'post', {
            'kld-from': process.env.PLAYER1_ADDRESS,
            'kld-ethvalue': process.env.MINIMAL_TICKET_PRICE,
            'kld-sync': true,
        });

        expect(response.status).to.equal(200);
        expect(response.data.headers).to.have.property(
            'type',
            'TransactionSuccess'
        );
        if (response.data.headers.type === 'TransactionSuccess') {
            currentPrizeFund = BigInt(process.env.MINIMAL_TICKET_PRICE);
        }
    });

    it('participants[0] should return amountSent and participantAddress of the player1', async () => {
        if(!process.env.PLAYER1_ADDRESS) {
            throw new Error("PLAYER1_ADDRESS environment variable is not set.");
        }
        if(!process.env.MINIMAL_TICKET_PRICE) {
            throw new Error("MINIMAL_TICKET_PRICE environment variable is not set.");
        }
        const response = await sendRequest(ENDPOINTS.PARTICIPANTS, 'get', {
            input: 0
        });

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property(
            'amountSent',
            process.env.MINIMAL_TICKET_PRICE
        );
        expect(response.data).to.have.property(
            'participantAddress',
            process.env.PLAYER1_ADDRESS
        );
    });

    it('prizeFund should be equal to the player1 amountSent', async () => {
        if(!process.env.MINIMAL_TICKET_PRICE) {
            throw new Error("MINIMAL_TICKET_PRICE environment variable is not set.");
        }
        const response = await sendRequest(ENDPOINTS.PRIZE_FUND);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property(
            'output',
            process.env.MINIMAL_TICKET_PRICE
        );
    });

    it('enterLottery should accept a player2 with minimal price + 1', async () => {
                if(!process.env.PLAYER2_ADDRESS) {
            throw new Error("PLAYER2_ADDRESS environment variable is not set.");
        }
        if(!process.env.MINIMAL_TICKET_PRICE) {
            throw new Error("MINIMAL_TICKET_PRICE environment variable is not set.");
        }
        const value = BigInt(process.env.MINIMAL_TICKET_PRICE) + 1n;
        const response = await sendRequest(ENDPOINTS.ENTER_LOTTERY, 'post', {
            'kld-from': process.env.PLAYER2_ADDRESS,
            'kld-ethvalue': value.toString(),
            'kld-sync': true,
        });

        expect(response.status).to.equal(200);
        expect(response.data.headers).to.have.property(
            'type',
            'TransactionSuccess'
        );
        if (response.data.headers.type === 'TransactionSuccess') {
            currentPrizeFund += BigInt(value);
        }
    });

    it('launchLottery should reject the owner when 2 players have entered', async () => {
        if(!process.env.OWNER_ADDRESS) {
            throw new Error("OWNER_ADDRESS environment variable is not set.");
        }
        const response = await sendRequest(ENDPOINTS.LAUNCH_LOTTERY, 'post', {
            'kld-from': process.env.OWNER_ADDRESS,
            'kld-sync': true,
        });

        expect(response.status).to.equal(500);
        expect(response.data).to.have.property(
            'error',
            'Call failed: execution reverted: Lottery must have at least 3 participants'
        );
    });

    it('enterLottery should accept a player3 with minimal price', async () => {
        if(!process.env.PLAYER3_ADDRESS) {
            throw new Error("PLAYER3_ADDRESS environment variable is not set.");
        }
        if(!process.env.MINIMAL_TICKET_PRICE) {
            throw new Error("MINIMAL_TICKET_PRICE environment variable is not set.");
        }
        const response = await sendRequest(ENDPOINTS.ENTER_LOTTERY, 'post', {
            'kld-from': process.env.PLAYER3_ADDRESS,
            'kld-ethvalue': process.env.MINIMAL_TICKET_PRICE,
            'kld-sync': true,
        });

        expect(response.status).to.equal(200);
        expect(response.data.headers).to.have.property(
            'type',
            'TransactionSuccess'
        );
        if (response.data.headers.type === 'TransactionSuccess') {
            currentPrizeFund += BigInt(process.env.MINIMAL_TICKET_PRICE);
        }
    });

    it('launchLottery should reject a non-owner when 3 players have entered', async () => {
        if(!process.env.PLAYER1_ADDRESS) {
            throw new Error("PLAYER1_ADDRESS environment variable is not set.");
        }
        const response = await sendRequest(ENDPOINTS.LAUNCH_LOTTERY, 'post', {
            'kld-from': process.env.PLAYER1_ADDRESS,
            'kld-sync': true,
        });

        expect(response.status).to.equal(500);
        expect(response.data).to.have.property(
            'error',
            'Call failed: execution reverted: Only the lottery organizer can launch the lottery.'
        );
    });

    it('launchLottery should accept the owner when 3 players have entered', async () => {
        if(!process.env.OWNER_ADDRESS) {
            throw new Error("OWNER_ADDRESS environment variable is not set.");
        }
        const response = await sendRequest(ENDPOINTS.LAUNCH_LOTTERY, 'post', {
            'kld-from': process.env.OWNER_ADDRESS,
            'kld-sync': true,
        });

        expect(response.status).to.equal(200);
        expect(response.data.headers).to.have.property(
            'type',
            'TransactionSuccess'
        );
    });

    /*
    now we save the updated values of the lottery total parameters
    and verify that they are updated
    */
    let updatedLotteryRoundsTotal;
    it('should receive updated lotteryRoundsTotal', async () => {
        const response = await sendRequest(ENDPOINTS.LOTTERY_ROUNDS_TOTAL);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('output');
        expect(response.data.output).to.be.a('string');
        updatedLotteryRoundsTotal = response.data.output;
    });

    it('lotteryRoundsTotal should be updated', () => {
        expect(updatedLotteryRoundsTotal).to.equal(
            (parseInt(initialLotteryRoundsTotal) + 1).toString()
        );
    });

    let updatedParticipantsTotal;
    it('should receive updated participantsTotal', async () => {
        const response = await sendRequest(ENDPOINTS.PARTICIPANTS_TOTAL);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('output');
        expect(response.data.output).to.be.a('string');
        updatedParticipantsTotal = response.data.output;
    });

    it('participantsTotal should be updated', () => {
        expect(updatedParticipantsTotal).to.equal(
            (parseInt(initialParticipantsTotal) + 3).toString()
        );
    });

    let updatedPrizeSentTotal;
    it('should receive updated prizeSentTotal', async () => {
        const response = await sendRequest(ENDPOINTS.PRIZE_SENT_TOTAL);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('output');
        expect(response.data.output).to.be.a('string');
        updatedPrizeSentTotal = response.data.output;
    });

    it('prizeSentTotal should be updated', () => {
        expect(updatedPrizeSentTotal).to.equal(
            (BigInt(initialPrizeSentTotal) + BigInt(currentPrizeFund)).toString()
        );
    });
});