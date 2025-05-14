require('dotenv').config();

if (!process.env.CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS environment variable is not set.");
}

const BASE_URL = `https://u0dyv8pkpb-u0xv9ktyn2-connect.us0-aws.kaleido.io/instances/${process.env.CONTRACT_ADDRESS}`;

module.exports = {
    BASE_URL,
    ENDPOINTS: {
        ENTER_LOTTERY: "/enterLottery",
        LAUNCH_LOTTERY: "/launchLottery",
        LOTTERY_ORGANIZER: "/lotteryOrganizer",
        LOTTERY_ROUND_TOTAL: "/lotteryRoundTotal",
        MINIMAL_TICKET_PRICE: "/minimalTicketPrice",
        PARTICIPANTS: "/participants",
        PARTICIPANTS_TOTAL: "/participantsTotal",
        PRIZE_FUND: "/prizeFund",
        PRIZE_SENT_TOTAL: "/prizeSentTotal",
    },
};