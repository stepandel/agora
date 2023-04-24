import { ethers } from "ethers";
import { GnosisSafe, GnosisSafe__factory } from "../contracts/generated";

export type ValueWithSignature = {
  signature: string;
  signerAddress: string;
  value: string;
};

export type ValidatedMessage = {
  address: string;
  value: string;
  signature: string;
  signatureType: "EOA" | "CONTRACT";
};

export function hashEnvelopeValue(value: string) {
  return JSON.stringify({
    for: "nouns-agora",
    hashedValue: ethers.utils.hashMessage(value),
  });
}

export async function checkSafeSignature(safe: GnosisSafe, value: string) {
  const hashed = ethers.utils.hashMessage(value);
  const messageHash = await safe.getMessageHash(hashed);
  const isSigned = await safe.signedMessages(messageHash);
  return !isSigned.isZero();
}

export async function validateSigned(
  provider: ethers.providers.Provider,
  { signerAddress, value, signature }: ValueWithSignature
): Promise<ValidatedMessage> {
  const parsedSignature = ethers.utils.arrayify(signature);
  const hashedMessage = hashEnvelopeValue(value);

  if (!parsedSignature.length) {
    const safe = GnosisSafe__factory.connect(signerAddress, provider);
    const isSigned = await checkSafeSignature(safe, hashedMessage);
    if (!isSigned) {
      throw new Error("not signed");
    }

    return {
      address: signerAddress,
      value,
      signature,
      signatureType: "CONTRACT",
    };
  } else {
    const address = ethers.utils.verifyMessage(hashedMessage, parsedSignature);
    if (address.toLowerCase() !== signerAddress.toLowerCase()) {
      throw new Error("signature address does not match signer address");
    }

    return {
      address,
      value,
      signature,
      signatureType: "EOA",
    };
  }
}
