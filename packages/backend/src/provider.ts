import { ethers } from "ethers";

export function makeProvider() {
  return makeAlchemyProvider();
}

export function makeAlchemyProvider() {
  return new ethers.providers.AlchemyProvider(
    "mainnet",
    process.env.ALCHEMY_API_KEY
  );
}

export function makeLocalhostProvider() {
  return new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");
}
