const { ENDPOINTS } = require('../config/endpoints');
const {
    sendRequest
} = require('../helpers/sendRequest');

describe('Lottery test suite', () => {
    it('should receive the owner', async () => {
        const response = await sendRequest(ENDPOINTS.LOTTERY_ORGANIZER);

        expect(response.status).to.equal(200);
        expect(response.data).to.have.property('output');
        expect(response.data.output).to.equal(process.env.OWNER_ADDRESS);
    });
});