const { expect } = require("chai");
const hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// Import the helper function
const { verifyLaunchLottery } = require("./helper/verifyLaunchLottery.js");

describe('Lottery tests', function () {

    // Create a fixture to deploy the Lottery contract, set up accounts, define ticket price
    async function deployLotteryFixture() {
        // Deploy the Lottery contract
        const lottery = await hre.ethers.deployContract("Lottery");

        // Get the signers
        const [
            organizer,
            participant1,
            participant2,
            participant3,
            participant4
        ] = await hre.ethers.getSigners();

        const ticketPrice = hre.ethers.parseEther("0.5");

        return { lottery, organizer, participant1, participant2, participant3, participant4, ticketPrice };
    }

    it('enterLottery() should revert if sender is lottery organizer', async function() {
        // Use the fixture
        const { lottery, ticketPrice } = await loadFixture(deployLotteryFixture);
        
        //call enterLottery from organizer's account with value = ticketPrice
        await expect(lottery.enterLottery({
            value: ticketPrice
        })).to.be.revertedWith('Lottery organizer is not allowed to participate.');
    });

    it('enterLottery() should revert for a non-organizer with value < ticket price', async function() {
        const { lottery, participant1 } = await loadFixture(deployLotteryFixture);
        
        // Call enterLottery with value < ticketPrice
        await expect(lottery.connect(participant1).enterLottery({
            value: hre.ethers.parseEther("0.4")
        })).to.be.revertedWith(
            'Transferred value is not enough to participate in the lottery. Check for public constant minimalTicketPrice.'
        );
    });

    it('enterLottery() should add a non-organizer with value = ticket price to participants', async function() {
        const { lottery, participant1, ticketPrice } = await loadFixture(deployLotteryFixture);
        
        // Call enterLottery as participant1 with value = ticketPrice
        await lottery.connect(participant1).enterLottery({
            value: ticketPrice
        });

        // Need to save the participant to address it as an object 
        const firstParticipant = await lottery.participants(0);

        // Check address and lot of participants[0]
        expect(firstParticipant.participantAddress).to.equal(participant1.address);
        expect(firstParticipant.amountSent).to.equal(ticketPrice);

        // Check that prizeFund was replenished
        expect(await lottery.prizeFund()).to.equal(ticketPrice);
    });

    it('enterLottery() should replenish the lot of an already participating one', async function () {
        const { lottery, participant1, ticketPrice } = await loadFixture(deployLotteryFixture);

        // Set up a precondition - participant1 is added with value = ticketPrice
        await lottery.connect(participant1).enterLottery({
            value: ticketPrice
        });

        // Call enterLottery as participant1 again with value = 0.4 ETH
        await lottery.connect(participant1).enterLottery({
            value: hre.ethers.parseEther("0.4")
        });

        // Need to save the participant to address it as an object 
        const firstParticipant = await lottery.participants(0);

        // Check address and lot of participants[0]
        expect(firstParticipant.participantAddress).to.equal(participant1.address);
        expect(firstParticipant.amountSent).to.equal(hre.ethers.parseEther("0.9"));

        // Check that prizeFund was replenished
        expect(await lottery.prizeFund()).to.equal(hre.ethers.parseEther("0.9"));
    });

    it('launchLottery() should revert for organizer if there are < 3 participants', async function() {
        const { lottery, participant2, ticketPrice } = await loadFixture(deployLotteryFixture);
        
        // Call enterLottery as participant2 with value = ticketPrice
        await lottery.connect(participant2).enterLottery({
            value: ticketPrice
        });

        // Call launchLottery from organizer's account
        await expect(lottery.launchLottery()).to.be.revertedWith(
            'Lottery must have at least 3 participants.'
        );
    });

    it('launchLottery() should revert for a non-organizer when there are 3 participants', async function() {
        const { lottery, participant1, participant3, ticketPrice } = await loadFixture(deployLotteryFixture);
        
        // Call enterLottery as participant3 with value = ticketPrice
        await lottery.connect(participant3).enterLottery({
            value: ticketPrice
        });

        // Call launchLottery from participant1's account
        await expect(lottery.connect(participant1).launchLottery()).to.be.revertedWith(
            'Only the lottery organizer can launch the lottery.'
        );
    });

    it('launchLottery() should send the prize to one of the participants, record the logs, reset participants[] and prizeFund if is called by organizer when there are 3 participants', async function() {
        const { lottery, participant1, participant2, participant3, ticketPrice } = await loadFixture(deployLotteryFixture);
        
        // Set up a precondition - add 3 participants
        await lottery.connect(participant1).enterLottery({ value: ticketPrice });
        await lottery.connect(participant2).enterLottery({ value: ticketPrice });
        await lottery.connect(participant3).enterLottery({ value: ticketPrice });

        // Use the helper function to verify launchLottery for 3 participants
        await verifyLaunchLottery(lottery, [
            participant1,
            participant2,
            participant3
        ]);
    });

    it('launchLottery() should send the prize to one of the participants, record the logs, reset participants[] and prizeFund if is called by organizer when there are 4 participants', async function() {
        const { lottery, participant1, participant2, participant3, participant4, ticketPrice } = await loadFixture(deployLotteryFixture);
        
        // Add 4 participants
        await lottery.connect(participant1).enterLottery({ value: ticketPrice });
        await lottery.connect(participant2).enterLottery({ value: ticketPrice });
        await lottery.connect(participant3).enterLottery({ value: ticketPrice });
        await lottery.connect(participant4).enterLottery({ value: ticketPrice });

        // Use the helper function to verify launchLottery
        await verifyLaunchLottery(lottery, [
            participant1,
            participant2,
            participant3,
            participant4
        ]);
    });
});