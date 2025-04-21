# learn-solidity

lottery branch contains a Solidity contract that contains a logic 
to conduct a lottery that consider the following requirements:

1. The lottery system should be secure, transparent, and ensure fair participation.
2. The lottery smart contract can have only one owner/administrator.
3. The administrator cannot participate as a user in the lottery.
4. Users should be able to participate by sending the entry request.
5. The minimum ticket price (lot) is 0.5 Ether.
6. A minimum of 3 users is required to participate in the lottery.
7. The winner is defined automatically.
8. Only the administrator can pick the winner, either randomly or using a pseudorandom method.
9. The lottery launch is triggered by sending "launch lottery" message from the owner.
10. When the lottery is launched the owner gets 10% of the prize fund.