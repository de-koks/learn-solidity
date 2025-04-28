const { expect } = require("chai");

async function verifyLaunchLottery(lottery, participants) {
    // Save the prizeFund before the lottery is launched
    const prizeFund = await lottery.prizeFund();

    // Call the method and capture the transaction object
    const tx = await lottery.launchLottery();

    // Verify that the transaction object exists and it's mined successfully
    expect(tx).to.exist;
    const receipt = await tx.wait(); // Wait for the transaction to be mined
    expect(receipt.status).to.equal(1); // Check that the transaction was successful

    console.log(receipt);

    // Check the tx value is equal to prizeFund
    expect(receipt.value).to.equal(prizeFund);

    // Check the tx address is one of the participants
    let isParticipant = false;
    for (let i = 0; i < participants.length; i++) {
        if (receipt.to === participants[i].address) {
            isParticipant = true;
            break;
        }
    }
    expect(isParticipant).to.be.true;

    // Check that prizeFund is reset to 0
    expect(await lottery.prizeFund()).to.equal(0);

    // Check that participants array is reset
    expect(await lottery.participants.length).to.equal(0);
}

module.exports = { verifyLaunchLottery };