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
    handleNewNotification("error");
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
        <div className="flex flex-col p-5">
          <p className="pt-5 pb-5 mb-2">
            Entrance Fee: {ethers.utils.formatEther(entranceFee)} ether
          </p>
          <Button
            theme="primary"
            type="button"
            text="Enter Lottery"
            disabled={isFetching || isLoading}
            onClick={handleEnterLottery}
          />
          <p className="pt-5 pb-5">Number of players: {playersCount}</p>
          <p className="pt-5 pb-5">Recent winner: {recentWinner}</p>
        </div>
      ) : (
        <p className="pt-5 pb-5">No Lottery contract address detected</p>
      )}
    </>
  );
}
