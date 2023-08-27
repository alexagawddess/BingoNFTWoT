import styles from "../styles/Home.module.css";
import Image from "next/image";
import { NextPage } from "next";
import { useContract, useNFTs, ThirdwebNftMedia, useAddress, useOwnedNFTs, ConnectWallet } from "@thirdweb-dev/react";


const Home: NextPage = () => {

  const address = useAddress();
  const contractAddress = "0x2CceC284704fb77b0845b4A86f610585521eC374";
  const { contract } = useContract(contractAddress);
  const { data: nfts } = useOwnedNFTs(
    contract,
    address,
  );

  const truncateAddress = (address: string) => {
    return (
      address.substring(0, 6) + "..." + address.substring(address.length - 4)
    );
  };

  return (
    <div className={styles.container}>
    <ConnectWallet />
      {nfts && nfts?.length > 0 && (
        <div className={styles.cards}>

          {nfts
            .filter(
              (nft) =>
                nft.owner !== "0x0000000000000000000000000000000000000000"
            )
            .map((nft) => (
              <div key={nft.metadata.id.toString()} className={styles.card}>
                <h1>{nft.metadata.name}</h1>
                <ThirdwebNftMedia
                  metadata={nft.metadata}
                  className={styles.image}
                />
                
                <p>
                  owned by{" "}
                  {address && nft.owner === address
                    ? "you"
                    : truncateAddress(nft.owner)}
                </p>
        </div>
      ))}
    </div>
  )}
</div>

  );
};

export default Home;