// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    address public lotteryOrganizer;
    uint public prizeFund;
    uint public constant minimalTicketPrice = 0.5 ether;

    //declare an object-like participant structure
    struct Participant {
        address payable participantAddress;
        uint256 amountSent;
    }

    //declare an array with participants
    Participant[] public participants;

    uint public lotteryRoundsTotal;
    uint public participantsTotal;
    uint public prizeSentTotal;

    constructor() {
        lotteryOrganizer = msg.sender;
    }

    //adding new participants and receiving additional values to existing participant lots
    function enterLottery() external payable {
        //check whether sender is lotteryOrganizer (they cannot participate)
        require(msg.sender != lotteryOrganizer, "Lottery organizer is not allowed to participate.");

        //check whether the sender has already been added to participants[]
        bool isParticipantExists = false;
        for (uint256 i = 0; i < participants.length; i++) {
            if(participants[i].participantAddress == msg.sender){

                //if yes - add msg.value to participant's amountSent
                participants[i].amountSent += msg.value;

                //update the flag's value
                isParticipantExists = true;

                //and value to prizeFund
                prizeFund += msg.value;

                //exit the loop
                break;
            }
        }

        //in case of a new participant
        if (!isParticipantExists) {

            //verify the minimal price is paid
            require(msg.value >= minimalTicketPrice,
                "Transferred value is not enough to participate in the lottery. Check for public constant minimalTicketPrice."
            );

            //and if so - add a new participant
            Participant memory newParticipant = Participant(payable (msg.sender), msg.value); // create a new participant convertins their address into a payable one
            participants.push(newParticipant);// push it to the participants[] array

            //add value to prizeFund
            prizeFund += msg.value;
        }        
    }

    // Function to pick the address of a random participant
    function pickRandomParticipant() internal view returns (address payable) {
        require(participants.length > 0, "No participants available.");

        // Generate pseudorandom number using block data
        uint256 randomIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))
        ) % participants.length;

        // Return the address of the random participant
        return participants[randomIndex].participantAddress;
    }

    function launchLottery() external {
        require(msg.sender == lotteryOrganizer, "Only the lottery organizer can launch the lottery.");
        require(participants.length > 2, "Lottery must have at least 3 participants.");

        //pick a random one among participants[]
        address payable winner = pickRandomParticipant();

        //send prize to the winner
        winner.transfer(prizeFund);

        //record the total logs
        lotteryRoundsTotal++; 
        participantsTotal += participants.length;
        prizeSentTotal += prizeFund;

        //bringing the lottery to the initial state
        delete participants;
        prizeFund = 0;
        //now we can conduct another issue of the lottery
    }
}