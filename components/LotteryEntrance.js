import {
  useEffect,
  useState,
} from 'react';

import { ethers } from 'ethers';
import {
  useMoralis,
  useWeb3Contract,
} from 'react-moralis';

import {
  Button,
  useNotification,
} from '@web3uikit/core';
import { Bell } from '@web3uikit/icons';

import {
  abi,
  contractAddress,
} from '../constants';

export default function LotteryEntrance() {
  const [entranceFee, setEntranceFee] = useState("0");
  const [playersCount, setPlayersCount] = useState("0");
  const [recentWinner, setRecentWinner] = useState("0");
  const dispatch = useNotification();

  // Contract Work
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis();
  const chainId = parseInt(chainIdHex, 16);
  const raffleAddress =
    chainId in contractAddress ? contractAddress[chainId][0] : null;

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getEntranceFee",
    params: {},
  });

  const {
    runContractFunction: enterRaffle,
    isFetching,
    isLoading,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "enterRaffle",
    params: {},
    msgValue: entranceFee, // 0.0001 ether
  });

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getNumberOfPlayers",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: raffleAddress,
    functionName: "getRecentWinner",
    params: {},
  });

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();
    } else {
      console.log("Please connect Wallet");
    }
  }, [isWeb3Enabled]);

  async function updateUI() {
    const fee = (await getEntranceFee()).toString();
    const players = (await getNumberOfPlayers()).toString();
    const recentWinner = await getRecentWinner();
    console.log("players", players);
    setEntranceFee(fee);
    setPlayersCount(players);
    setRecentWinner(recentWinner);
  }

  const handleNewNotification = (type, title, message, icon, position) => {
    dispatch({
      type,
      message: message || "Transaction successful!",
      title: title || "Transaction Notification",
      icon: icon || <Bell />,
      position: position || "topR",
    });
  };

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    handleNewNotification("success");
    updateUI();
  };

  const handleError = (error) => {
    handleNewNotification("error", "Transaction Failed", error.message);
    console.log({ error });
  };

  const handleEnterLottery = async () => {
    await enterRaffle({
      onSuccess: handleSuccess,
      onError: handleError,
    });
  };

  return (
    <>
      {raffleAddress ? (
        <div className="flex flex-col p-4">
          <h2 className="font-bold">Instructions</h2>
          <div
            className="font-thin tracking-wide
"
          >
            <p>1. Connect your wallet with Rinkeby network.</p>
            <p>
              2. Fill you wallet with some Rinkeby eth from
              <a
                href="https://faucets.chain.link/rinkeby"
                target="_blank"
                rel="noopener noreferrer"
                className="font-normal text-blue-600 visited:text-purple-600"
              >
                {" "}
                here
              </a>
            </p>
            <p>3. Enter the lottery by clicking the button below.</p>
            <p>
              4. Winner will be picked from list of players randomly after 30
              days.
            </p>
          </div>

          <p className="py-4 mb-2">
            Entrance Fee: {ethers.utils.formatEther(entranceFee)} ether
          </p>
          <Button
            theme="primary"
            type="button"
            text="Enter Lottery"
            disabled={isFetching || isLoading}
            onClick={handleEnterLottery}
          />
          <p className="py-4">Number of players participated: {playersCount}</p>
          <p className="py-4">Recent winner: {recentWinner}</p>
        </div>
      ) : (
        <div className="px-4">
          <p className="py-4">Welcome to the Decentralized Lottery System</p>
          <p className="py-4">Please click on Connect Wallet to get started</p>
        </div>
      )}
    </>
  );
}
