const { expect } = require("chai");
const hre = require("hardhat");

// Import the helper function
const { verifyLaunchLottery } = require("./helper/verifyLaunchLottery.js");

describe('Lottery tests', function () {
    let lottery;
    let organizer;
    let participant1;
    let participant2;
    let participant3;
    let participant4;
    const ticketPrice = hre.ethers.parseEther("0.5");

    beforeAll('Deploy Lottery contract, set up accounts', async function() {
        lottery = await hre.ethers.deployContract("Lottery");
        [
            organizer,
            participant1,
            participant2,
            participant3,
            participant4
        ] = await hre.ethers.getSigners();
    });

    afterEach('Connect organizer account to Lottery contract to make it used by default', async function() {
        // Connect organizer account to Lottery contract
        lottery = lottery.connect(organizer);
    });

    it('pickRandomParticipant() should revert if there are no participants', async function() {
        // Call pickRandomParticipant with no participants
        await expect(lottery.pickRandomParticipant()).to.be.revertedWith(
            'No participants available.'
        );
    });

    it('enterLottery() should revert if sender is lottery organizer', async function() {
        //call enterLottery from organizer's account with value = ticketPrice
        await expect(lottery.enterLottery({
            value: ticketPrice
        })).to.be.revertedWith('Lottery organizer is not allowed to participate.');
    });

    it('enterLottery() should revert for a non-organizer with value < ticket price', async function() {
        // Call enterLottery with value < ticketPrice
        await expect(lottery.connect(participant1).enterLottery({
            value: hre.ethers.parseEther("0.4")
        })).to.be.revertedWith(
            'Transferred value is not enough to participate in the lottery. Check for public constant minimalTicketPrice.'
        );
    });

    it('enterLottery() should add a non-organizer with value = ticket price to participants', async function() {
        // Call enterLottery as participant1 with value = ticketPrice
        await lottery.connect(participant1).enterLottery({
            value: ticketPrice
        });

        // Verify that address and lot of participants[0] are belong to participant1
        expect(
            await lottery.participants(0).participantAddress
        ).to.equal(participant1.address);

        expect(
            await lottery.participants(0).amountSent
        ).to.equal(ticketPrice);

        // Check that prizeFund was replenished
        expect(await lottery.prizeFund()).to.equal(ticketPrice);
    });

    it('enterLottery() should replenish the lot of an already participating one', async function () {
        // Call enterLottery as participant1 again
        await lottery.connect(participant1).enterLottery({
            value: hre.ethers.parseEther("0.4")
        });

        // Check address and lot of participants[0]
        expect(
            await lottery.participants(0).participantAddress
        ).to.equal(participant1.address);

        expect(
            await lottery.participants(0).amountSent
        ).to.equal(hre.ethers.parseEther("0.9"));

        // Check that prizeFund was replenished
        expect(await lottery.prizeFund()).to.equal(hre.ethers.parseEther("0.9"));
    });

    it('launchLottery() should revert for organizer if there are < 3 participants', async function() {
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
        // Call enterLottery as participant3 with value = ticketPrice
        await lottery.connect(participant3).enterLottery({
            value: ticketPrice
        });

        // Call launchLottery from participant1's account
        await expect(lottery.connect(participant1).launchLottery()).to.be.revertedWith(
            'Only the lottery organizer can launch the lottery.'
        );
    });

    // it('pickRandomParticipant() should return one of the participants address when thre are 3 participants', async function() {
    //     // Call pickRandomParticipant
    //     const randomParticipant = await lottery.pickRandomParticipant();

    //     // Verify that randomParticipant matches one of the participant addresses
    //     let isParticipant = false;
    //     const participantsCount = await lottery.participants.length;
    //     for (let i = 0; i < participantsCount; i++) {
    //         if (randomParticipant === (await lottery.participants(i)).participantAddress) {
    //             isParticipant = true;
    //             break;
    //         }
    //     }
    //     expect(isParticipant).to.be.true;
    // });

    it('launchLottery() should trigger a tx transferring the prize to one of the participants, record the logs, reset participants[] and prizeFund if is called by organizer when there are 3 participants', async function() {
        // Use the helper function to verify launchLottery for 3 participants
        await verifyLaunchLottery(lottery, [
            participant1,
            participant2,
            participant3
        ]);
    });

    it('launchLottery() should conduct a lottery with 4 participants', async function() {
        // Add 4 participants
        await lottery.connect(participant1).enterLottery({ value: ticketPrice });
        await lottery.connect(participant2).enterLottery({ value: ticketPrice });
        await lottery.connect(participant3).enterLottery({ value: ticketPrice });
        await lottery.connect(participant4).enterLottery({ value: ticketPrice });

        // Verify the number of participants
        expect(await lottery.participants.length).to.equal(4);

        // Use the helper function to verify launchLottery
        await verifyLaunchLottery(lottery, [
            participant1,
            participant2,
            participant3,
            participant4
        ]);
    });
});